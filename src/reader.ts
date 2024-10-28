import { Connection } from "./connection"
import { crc16 } from "./crc"
import * as exceptions from "./exceptions"
import { isEqualBytes, bytesToHex, concatBytes, numberToBytes, numberToHex } from "./utils"


export interface ResponseDataBlock {
    length: number;
    adr: number;
    recmd: number;
    status: number;
    data: Uint8Array;
    crc: Uint8Array;
}

export interface ReaderInfo {
    version: Uint8Array;
    reader_type: Uint8Array;
    supported_type: Uint8Array;
    dmaxfre: Uint8Array;
    dminfre: Uint8Array;
    power: Uint8Array;
    scan_time: Uint8Array;
}

export interface WorkMode {
    wg_mode: Uint8Array;
    wg_data_interval: Uint8Array;
    wg_pulse_width: Uint8Array;
    wg_pulse_interval: Uint8Array;
    read_mode: Uint8Array;
    mode_state: Uint8Array;
    mem_inven: Uint8Array;
    first_adr: Uint8Array;
    word_num: Uint8Array;
    tag_time: Uint8Array;
    accuracy: Uint8Array;
    offset_time: Uint8Array;
}

export class UHFReader18CompliantReader {
    // Command code
    CMD_INVENTORY = 0x01;
    CMD_READ_DATA = 0x02;
    CMD_WRITE_DATA = 0x03;
    CMD_WRITE_EPC = 0x04;
    CMD_KILL_TAG = 0x05;
    CMD_LOCK = 0x06;
    CMD_BLOCK_ERASE = 0x07;
    CMD_READ_PROTECT = 0x08;
    CMD_READ_PROTECT_NO_EPC = 0x09;
    CMD_RESET_READ_PROTECT = 0x0A;
    CMD_CHECK_READ_PROTECT = 0x0B;
    CMD_EAS_ALARM = 0x0C;
    CMD_CHECK_EAS_ALARM = 0x0D;
    CMD_BLOCK_LOCK = 0x0E;
    CMD_INVENTORY_SINGLE = 0x0F;
    CMD_BLOCK_WRITE = 0x10;
    CMD_6B_INVENTORY_SIGNAL = 0x50;
    CMD_6B_INVENTORY_MULTIPLE = 0x51;
    CMD_6B_READ_DATA = 0x52;
    CMD_6B_WRITE_DATA = 0x53;
    CMD_6B_CHECK_LOCK = 0x54;
    CMD_6B_LOCK = 0x55;
    CMD_GET_READER_INFO = 0x21;
    CMD_SET_REGION = 0x22;
    CMD_SET_ADDRESS = 0x24;
    CMD_SET_SCAN_TIME = 0x25;
    CMD_SET_BAUD_RATE = 0x28;
    CMD_SET_POWER = 0x2F;
    CMD_ACOUSTOOPTIC_CONTROL = 0x33;
    CMD_SET_WIEGAND = 0x34;
    CMD_SET_WORK_MODE = 0x35;
    CMD_GET_WORK_MODE = 0x36;
    CMD_SET_EAS_ACCURACY = 0x37;
    CMD_SYRIS_RESPONSE_OFFSET = 0x38;
    CMD_TRIGGER_OFFSET = 0x3B;

    // Memory layout
    MEM_PWD = 0x00;
    MEM_EPC = 0x01;
    MEM_TID = 0x02;
    MEM_USER = 0x03;
    MEM_INVENTORY_MULTIPLE = 0x04;
    MEM_INVENTORY_SINGLE = 0x05;
    MEM_EAS_ALARM = 0x06;

    // Read mode
    MODE_ANSWER = 0x00;
    MODE_SCAN = 0x01;
    MODE_TRIGGER_LOW = 0x02;
    MODE_TRIGGER_HIGH = 0x03;

    // Mode state
    MS_PROTO_18000_6C = 0;
    MS_PROTO_18000_6B = 1;
    MS_OUT_WIEGAND = 0;
    MS_OUT_RS = 2;
    MS_BEEP_ON = 0;
    MS_BEEP_OFF = 4;
    MS_WIEGAND_FIRST_ADR_WORD = 0;
    MS_WIEGAND_FIRST_ADR_Uint8Array = 8;
    MS_SYRIS485_DISABLE = 0;
    MS_SYRIS485_ENABLE = 16;

    // Select
    SELECT_KILL_PWD = 0x00;
    SELECT_ACCESS_PWD = 0x01;
    SELECT_EPC_MEMORY = 0x02;
    SELECT_TID_MEMORY = 0x03;
    SELECT_USER_MEMORY = 0x04;

    // SetProtect
    SP_ANY = 0x00;
    SP_PERMANENT = 0x01;
    SP_SECURED = 0x02;
    SP_NEVER = 0x03;

    PWD_ZERO = new Uint8Array([0x00, 0x00, 0x00, 0x00]);


    addr: Uint8Array;
    conn: Connection;
    scan_callback: Function;

    constructor(addr: Uint8Array, conn: Connection) {
        this.addr = addr
        this.conn = conn
        this.scan_callback = null
    }

    assert_resp_zero_status(response: ResponseDataBlock): void {
        if (response["status"] != 0x00)
            throw new Error("Response status should be zero");
    }

    /* Compose Command Data Block */
    compose_CDB(cmd: number, data: Uint8Array): Uint8Array {
        /*
        Length (in bytes) considers:
        - address (1 byte)
        - cmd code (1 byte)
        - data (variable)
        - LSB-CRC16 (1 byte)
        - MSB-CRC16 (1 byte)
        */
        length = data.length + 4;
        let CDB = concatBytes([
            numberToBytes(length, 1, 'big'),
            this.addr,
            new Uint8Array([cmd]),
            data
        ]);
        let crc = crc16(CDB);
        CDB = concatBytes([CDB, crc]);

        return CDB;
    }

    /* Decompose Response Data Block into its components */
    decompose_RDB(RDB: Uint8Array): ResponseDataBlock {
        let length: number = RDB[0];
        let adr: number = RDB[1];
        let recmd: number = RDB[2];
        let status: number = RDB[3];
        let data: Uint8Array;
        let crc: Uint8Array = RDB.slice(length - 1, length + 1);

        if (length == 5) {
            data = new Uint8Array(0);
        } else {
            data = RDB.slice(4, length - 1);
        }

        let supposed_crc: Uint8Array = crc16(RDB.slice(0, length - 1));
        if (!isEqualBytes(supposed_crc, crc))
            throw new Error("Data integrity failed, CRC doesn't match");

        return { length, adr, recmd, status, data, crc };
    }

    get_response(): ResponseDataBlock {
        let RDB = this.conn.read();
        if (!RDB)
            return;

        let response = this.decompose_RDB(RDB);
        let status = response["status"];

        if (status == 0x05) {
            throw new exceptions.AccessPasswordError("Access password is invalid");
        } else if (status == 0x0B) {
            throw new exceptions.NotSupportCommandError("Tag does not support command");
        } else if (status == 0x0C) {
            throw new exceptions.AccessPasswordIsZeroError("Command requires non-zero access password");
        } else if (status == 0x13) {
            throw new exceptions.SaveFailError("Fail to save");
        } else if (status == 0x14) {
            throw new exceptions.CannotAdjustError("Power can not be adjusted");
        } else if (status == 0x19) {
            throw new exceptions.NotSupportCommandOrAccessPasswordError("Command is not supported or access password is invalid");
        } else if (status == 0xF9) {
            throw new exceptions.CommandExecuteError("Fail to execute command");
        } else if (status == 0xFA) {
            throw new exceptions.PoorCommunicationError("Poor communication between reader and tag");
        } else if (status == 0xFB) {
            throw new exceptions.NoTagOperableError("No tag in the effective field");
        } else if (status == 0xFC) {
            throw new exceptions.TagReturnCodeError("Error code: " + bytesToHex(response["data"]));
        } else if (status == 0xFD) {
            throw new exceptions.CommandLengthWrongError("Length of command doesn't conform to the command request");
        } else if (status == 0xFE) {
            throw new exceptions.IllegalCommandError("Unrecognized command or CRC error");
        } else if (status == 0xFF) {
            throw new exceptions.ParameterError("Command parameter is invalid");
        }

        if (response["recmd"] == 0xEE) {  // response is a result of scan
            this.pass_scan_output(response);
            return this.get_response();
        }

        return response;
    }

    send_command(cmd: number, data: Uint8Array): ResponseDataBlock {
        let CDB = this.compose_CDB(cmd, data);
        this.conn.write(CDB);
        let response = this.get_response();

        response["recmd"] == cmd, "Response command invalid";

        return response;
    }

    calc_word_length(epc: Uint8Array): number {
        if (epc.length % 2 != 0)
            throw new Error("Data is not divisible to words");
        return Math.ceil(epc.length / 2);
    }

    parse_multiple_epc(data: Uint8Array): Uint8Array[] {
        let num = data[0];

        let epc_list: Uint8Array[] = [];
        let index = 0;
        while (epc_list.length < num) {
            // First byte is the length
            let length = data[index++];
            // EPC is exactly after the length
            let epc = data.slice(index, index + length);
            epc_list.push(epc);
            index += length;
        }

        return epc_list;
    }

    inventory(): Uint8Array[] {
        let cmd = this.CMD_INVENTORY;
        let data = new Uint8Array(0);
        let response = this.send_command(cmd, data);

        if (!response)
            return;

        if (response["status"] != 0x01)
            throw new Error("Error code: " + numberToHex(response["status"], 1, 'big'));

        return this.parse_multiple_epc(response["data"]);
    }

    pass_scan_output(response: ResponseDataBlock): void {
        if (this.scan_callback == null)
            return;
        this.scan_callback(response);
    }

    read_data(
        epc: Uint8Array,
        mem: number = this.MEM_EPC,
        wordptr: Uint8Array = new Uint8Array([0x00]),
        num: Uint8Array = new Uint8Array([0x77]),
        pwd: Uint8Array = this.PWD_ZERO,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): Uint8Array {
        let _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        let cmd = this.CMD_READ_DATA;
        let data = concatBytes([
            _enum,
            epc,
            numberToBytes(mem, 1, 'big'),
            wordptr,
            num,
            pwd,
            maskadr,
            masklen
        ]);
        let response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);

        return response["data"];
    }

    write_data(
        epc: Uint8Array,
        mem: Uint8Array,
        wordptr: Uint8Array,
        wdt: Uint8Array,
        pwd: Uint8Array = this.PWD_ZERO,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): void {
        const cmd = this.CMD_WRITE_DATA;
        const _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        const wnum = numberToBytes(this.calc_word_length(wdt), 1, 'big');
        const data = concatBytes([
            wnum,
            _enum,
            epc,
            mem,
            wordptr,
            wdt,
            pwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    write_epc(wepc: Uint8Array, pwd: Uint8Array = this.PWD_ZERO): void {
        const _enum = numberToBytes(this.calc_word_length(wepc), 1, 'big');
        const cmd = this.CMD_WRITE_EPC;
        const data = concatBytes([
            _enum,
            pwd,
            wepc
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    kill_tag(
        epc: Uint8Array,
        killpwd: Uint8Array,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): void {
        const _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_KILL_TAG;
        const data = concatBytes([
            _enum,
            epc,
            killpwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    lock(
        epc: Uint8Array,
        select: Uint8Array,
        setprotect: Uint8Array,
        pwd: Uint8Array,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): void {
        const _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_LOCK;
        const data = concatBytes([
            _enum,
            epc,
            select,
            setprotect,
            pwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    block_erase(
        epc: Uint8Array,
        mem: Uint8Array,
        wordptr: Uint8Array,
        num: Uint8Array,
        pwd: Uint8Array = this.PWD_ZERO,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): void {
        const _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_BLOCK_ERASE;
        const data = concatBytes([
            _enum,
            epc,
            mem,
            wordptr,
            num,
            pwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    inventory_single(): Uint8Array[] {
        const cmd = this.CMD_INVENTORY_SINGLE;
        const data = new Uint8Array(0);
        const response = this.send_command(cmd, data);

        if (!response)
            return;

        if (response["status"] != 0x01)
            throw new Error("Error code: " + numberToHex(response["status"], 1, 'big'));

        return this.parse_multiple_epc(response["data"]);
    }

    block_write(
        epc: Uint8Array,
        mem: Uint8Array,
        wordptr: Uint8Array,
        wdt: Uint8Array,
        pwd: Uint8Array = this.PWD_ZERO,
        maskadr: Uint8Array = new Uint8Array([0x00]),
        masklen: Uint8Array = new Uint8Array([0x01])
    ): void {
        const cmd = this.CMD_BLOCK_WRITE;
        const _enum = numberToBytes(this.calc_word_length(epc), 1, 'big');
        const wnum = numberToBytes(this.calc_word_length(wdt), 1, 'big');
        const data = concatBytes([
            wnum,
            _enum,
            epc,
            mem,
            wordptr,
            wdt,
            pwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    get_reader_info(): ReaderInfo {
        const cmd = this.CMD_GET_READER_INFO;
        const data = new Uint8Array(0);
        const response = this.send_command(cmd, data);

        const resp_data = response["data"];
        this.assert_resp_zero_status(response);

        return {
            version: resp_data.slice(0, 2),
            reader_type: resp_data.slice(2, 3),
            supported_type: resp_data.slice(3, 4),
            dmaxfre: resp_data.slice(4, 5),
            dminfre: resp_data.slice(5, 6),
            power: resp_data.slice(6),
            scan_time: resp_data.slice(7)
        };
    }

    set_work_mode(
        read_mode: Uint8Array,
        mode_state: Uint8Array | number,
        mem_inven: number = this.MEM_EPC,
        first_adr: Uint8Array = new Uint8Array([0x00]),
        word_num: Uint8Array = new Uint8Array([0x01]),
        tag_time: Uint8Array = new Uint8Array([0x00])
    ): void {
        if (typeof mode_state === 'number')
            mode_state = numberToBytes(mode_state, 1, "big");

        let cmd = this.CMD_SET_WORK_MODE;
        let data = concatBytes([
            read_mode,
            mode_state,
            numberToBytes(mem_inven, 1, 'big'),
            first_adr,
            word_num,
            tag_time
        ]);
        let response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }

    get_work_mode(): WorkMode {
        const cmd = this.CMD_GET_WORK_MODE;
        const data = new Uint8Array(0);
        const response = this.send_command(cmd, data);

        if (response["status"] != 0x00)
            throw new Error();

        const resp_data = response["data"];

        return {
            wg_mode: resp_data.slice(0, 1),
            wg_data_interval: resp_data.slice(1, 2),
            wg_pulse_width: resp_data.slice(2, 3),
            wg_pulse_interval: resp_data.slice(3, 4),
            read_mode: resp_data.slice(4, 5),
            mode_state: resp_data.slice(5, 6),
            mem_inven: resp_data.slice(6, 7),
            first_adr: resp_data.slice(7, 8),
            word_num: resp_data.slice(8, 9),
            tag_time: resp_data.slice(9, 10),
            accuracy: resp_data.slice(10, 11),
            offset_time: resp_data.slice(11, 1)
        };
    }

    onscan(callback: Function): void {
        this.scan_callback = callback;
    }
}


export class CTI809 extends UHFReader18CompliantReader { }