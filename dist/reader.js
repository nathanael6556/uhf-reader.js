"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CTI809 = exports.UHFReader18CompliantReader = void 0;
const crc_1 = require("./crc");
const exceptions = __importStar(require("./exceptions"));
const utils_1 = require("./utils");
class UHFReader18CompliantReader {
    constructor(addr, conn) {
        // Command code
        this.CMD_INVENTORY = 0x01;
        this.CMD_READ_DATA = 0x02;
        this.CMD_WRITE_DATA = 0x03;
        this.CMD_WRITE_EPC = 0x04;
        this.CMD_KILL_TAG = 0x05;
        this.CMD_LOCK = 0x06;
        this.CMD_BLOCK_ERASE = 0x07;
        this.CMD_READ_PROTECT = 0x08;
        this.CMD_READ_PROTECT_NO_EPC = 0x09;
        this.CMD_RESET_READ_PROTECT = 0x0A;
        this.CMD_CHECK_READ_PROTECT = 0x0B;
        this.CMD_EAS_ALARM = 0x0C;
        this.CMD_CHECK_EAS_ALARM = 0x0D;
        this.CMD_BLOCK_LOCK = 0x0E;
        this.CMD_INVENTORY_SINGLE = 0x0F;
        this.CMD_BLOCK_WRITE = 0x10;
        this.CMD_6B_INVENTORY_SIGNAL = 0x50;
        this.CMD_6B_INVENTORY_MULTIPLE = 0x51;
        this.CMD_6B_READ_DATA = 0x52;
        this.CMD_6B_WRITE_DATA = 0x53;
        this.CMD_6B_CHECK_LOCK = 0x54;
        this.CMD_6B_LOCK = 0x55;
        this.CMD_GET_READER_INFO = 0x21;
        this.CMD_SET_REGION = 0x22;
        this.CMD_SET_ADDRESS = 0x24;
        this.CMD_SET_SCAN_TIME = 0x25;
        this.CMD_SET_BAUD_RATE = 0x28;
        this.CMD_SET_POWER = 0x2F;
        this.CMD_ACOUSTOOPTIC_CONTROL = 0x33;
        this.CMD_SET_WIEGAND = 0x34;
        this.CMD_SET_WORK_MODE = 0x35;
        this.CMD_GET_WORK_MODE = 0x36;
        this.CMD_SET_EAS_ACCURACY = 0x37;
        this.CMD_SYRIS_RESPONSE_OFFSET = 0x38;
        this.CMD_TRIGGER_OFFSET = 0x3B;
        // Memory layout
        this.MEM_PWD = 0x00;
        this.MEM_EPC = 0x01;
        this.MEM_TID = 0x02;
        this.MEM_USER = 0x03;
        this.MEM_INVENTORY_MULTIPLE = 0x04;
        this.MEM_INVENTORY_SINGLE = 0x05;
        this.MEM_EAS_ALARM = 0x06;
        // Read mode
        this.MODE_ANSWER = 0x00;
        this.MODE_SCAN = 0x01;
        this.MODE_TRIGGER_LOW = 0x02;
        this.MODE_TRIGGER_HIGH = 0x03;
        // Mode state
        this.MS_PROTO_18000_6C = 0;
        this.MS_PROTO_18000_6B = 1;
        this.MS_OUT_WIEGAND = 0;
        this.MS_OUT_RS = 2;
        this.MS_BEEP_ON = 0;
        this.MS_BEEP_OFF = 4;
        this.MS_WIEGAND_FIRST_ADR_WORD = 0;
        this.MS_WIEGAND_FIRST_ADR_Uint8Array = 8;
        this.MS_SYRIS485_DISABLE = 0;
        this.MS_SYRIS485_ENABLE = 16;
        // Select
        this.SELECT_KILL_PWD = 0x00;
        this.SELECT_ACCESS_PWD = 0x01;
        this.SELECT_EPC_MEMORY = 0x02;
        this.SELECT_TID_MEMORY = 0x03;
        this.SELECT_USER_MEMORY = 0x04;
        // SetProtect
        this.SP_ANY = 0x00;
        this.SP_PERMANENT = 0x01;
        this.SP_SECURED = 0x02;
        this.SP_NEVER = 0x03;
        this.PWD_ZERO = new Uint8Array([0x00, 0x00, 0x00, 0x00]);
        this.addr = addr;
        this.conn = conn;
        this.scan_callback = null;
    }
    assert_resp_zero_status(response) {
        if (response["status"] != 0x00)
            throw new Error("Response status should be zero");
    }
    /* Compose Command Data Block */
    compose_CDB(cmd, data) {
        /*
        Length (in bytes) considers:
        - address (1 byte)
        - cmd code (1 byte)
        - data (variable)
        - LSB-CRC16 (1 byte)
        - MSB-CRC16 (1 byte)
        */
        length = data.length + 4;
        let CDB = (0, utils_1.concatBytes)([
            (0, utils_1.numberToBytes)(length, 1, 'big'),
            this.addr,
            new Uint8Array([cmd]),
            data
        ]);
        let crc = (0, crc_1.crc16)(CDB);
        CDB = (0, utils_1.concatBytes)([CDB, crc]);
        return CDB;
    }
    /* Decompose Response Data Block into its components */
    decompose_RDB(RDB) {
        let length = RDB[0];
        let adr = RDB[1];
        let recmd = RDB[2];
        let status = RDB[3];
        let data;
        let crc = RDB.slice(length - 1, length + 1);
        if (length == 5) {
            data = new Uint8Array(0);
        }
        else {
            data = RDB.slice(4, length - 1);
        }
        let supposed_crc = (0, crc_1.crc16)(RDB.slice(0, length - 1));
        if (!(0, utils_1.isEqualBytes)(supposed_crc, crc))
            throw new Error("Data integrity failed, CRC doesn't match");
        return { length, adr, recmd, status, data, crc };
    }
    get_response() {
        let RDB = this.conn.read();
        if (!RDB)
            return;
        let response = this.decompose_RDB(RDB);
        let status = response["status"];
        if (status == 0x05) {
            throw new exceptions.AccessPasswordError("Access password is invalid");
        }
        else if (status == 0x0B) {
            throw new exceptions.NotSupportCommandError("Tag does not support command");
        }
        else if (status == 0x0C) {
            throw new exceptions.AccessPasswordIsZeroError("Command requires non-zero access password");
        }
        else if (status == 0x13) {
            throw new exceptions.SaveFailError("Fail to save");
        }
        else if (status == 0x14) {
            throw new exceptions.CannotAdjustError("Power can not be adjusted");
        }
        else if (status == 0x19) {
            throw new exceptions.NotSupportCommandOrAccessPasswordError("Command is not supported or access password is invalid");
        }
        else if (status == 0xF9) {
            throw new exceptions.CommandExecuteError("Fail to execute command");
        }
        else if (status == 0xFA) {
            throw new exceptions.PoorCommunicationError("Poor communication between reader and tag");
        }
        else if (status == 0xFB) {
            throw new exceptions.NoTagOperableError("No tag in the effective field");
        }
        else if (status == 0xFC) {
            throw new exceptions.TagReturnCodeError("Error code: " + (0, utils_1.bytesToHex)(response["data"]));
        }
        else if (status == 0xFD) {
            throw new exceptions.CommandLengthWrongError("Length of command doesn't conform to the command request");
        }
        else if (status == 0xFE) {
            throw new exceptions.IllegalCommandError("Unrecognized command or CRC error");
        }
        else if (status == 0xFF) {
            throw new exceptions.ParameterError("Command parameter is invalid");
        }
        if (response["recmd"] == 0xEE) { // response is a result of scan
            this.pass_scan_output(response);
            return this.get_response();
        }
        return response;
    }
    send_command(cmd, data) {
        let CDB = this.compose_CDB(cmd, data);
        this.conn.write(CDB);
        let response = this.get_response();
        response["recmd"] == cmd, "Response command invalid";
        return response;
    }
    calc_word_length(epc) {
        if (epc.length % 2 != 0)
            throw new Error("Data is not divisible to words");
        return Math.ceil(epc.length / 2);
    }
    parse_multiple_epc(data) {
        let num = data[0];
        let epc_list = [];
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
    inventory(adrTID = null, lenTID = null) {
        let cmd = this.CMD_INVENTORY;
        let data;
        if (adrTID == null || lenTID == null) {
            data = (0, utils_1.concatBytes)([adrTID, lenTID]);
        }
        else {
            data = new Uint8Array(0);
        }
        let response = this.send_command(cmd, data);
        if (!response)
            return;
        if (response["status"] != 0x01)
            throw new Error("Error code: " + (0, utils_1.numberToHex)(response["status"], 1, 'big'));
        return this.parse_multiple_epc(response["data"]);
    }
    pass_scan_output(response) {
        if (this.scan_callback == null)
            return;
        this.scan_callback(response);
    }
    read_data(epc, mem = this.MEM_EPC, wordptr = new Uint8Array([0x00]), num = new Uint8Array([0x77]), pwd = this.PWD_ZERO, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        let _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        let cmd = this.CMD_READ_DATA;
        let data = (0, utils_1.concatBytes)([
            _enum,
            epc,
            (0, utils_1.numberToBytes)(mem, 1, 'big'),
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
    write_data(epc, mem, wordptr, wdt, pwd = this.PWD_ZERO, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        const cmd = this.CMD_WRITE_DATA;
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        const wnum = (0, utils_1.numberToBytes)(this.calc_word_length(wdt), 1, 'big');
        const data = (0, utils_1.concatBytes)([
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
    write_epc(wepc, pwd = this.PWD_ZERO) {
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(wepc), 1, 'big');
        const cmd = this.CMD_WRITE_EPC;
        const data = (0, utils_1.concatBytes)([
            _enum,
            pwd,
            wepc
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }
    kill_tag(epc, killpwd, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_KILL_TAG;
        const data = (0, utils_1.concatBytes)([
            _enum,
            epc,
            killpwd,
            maskadr,
            masklen
        ]);
        const response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }
    lock(epc, select, setprotect, pwd, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_LOCK;
        const data = (0, utils_1.concatBytes)([
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
    block_erase(epc, mem, wordptr, num, pwd = this.PWD_ZERO, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        const cmd = this.CMD_BLOCK_ERASE;
        const data = (0, utils_1.concatBytes)([
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
    inventory_single() {
        const cmd = this.CMD_INVENTORY_SINGLE;
        const data = new Uint8Array(0);
        const response = this.send_command(cmd, data);
        if (!response)
            return;
        if (response["status"] != 0x01)
            throw new Error("Error code: " + (0, utils_1.numberToHex)(response["status"], 1, 'big'));
        return this.parse_multiple_epc(response["data"]);
    }
    block_write(epc, mem, wordptr, wdt, pwd = this.PWD_ZERO, maskadr = new Uint8Array([0x00]), masklen = new Uint8Array([0x01])) {
        const cmd = this.CMD_BLOCK_WRITE;
        const _enum = (0, utils_1.numberToBytes)(this.calc_word_length(epc), 1, 'big');
        const wnum = (0, utils_1.numberToBytes)(this.calc_word_length(wdt), 1, 'big');
        const data = (0, utils_1.concatBytes)([
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
    get_reader_info() {
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
    set_work_mode(read_mode, mode_state, mem_inven = this.MEM_EPC, first_adr = new Uint8Array([0x00]), word_num = new Uint8Array([0x01]), tag_time = new Uint8Array([0x00])) {
        if (typeof mode_state === 'number')
            mode_state = (0, utils_1.numberToBytes)(mode_state, 1, "big");
        let cmd = this.CMD_SET_WORK_MODE;
        let data = (0, utils_1.concatBytes)([
            read_mode,
            mode_state,
            (0, utils_1.numberToBytes)(mem_inven, 1, 'big'),
            first_adr,
            word_num,
            tag_time
        ]);
        let response = this.send_command(cmd, data);
        this.assert_resp_zero_status(response);
    }
    get_work_mode() {
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
    onscan(callback) {
        this.scan_callback = callback;
    }
}
exports.UHFReader18CompliantReader = UHFReader18CompliantReader;
class CTI809 extends UHFReader18CompliantReader {
}
exports.CTI809 = CTI809;
//# sourceMappingURL=reader.js.map