import { bytesToHex } from "./utils"


export interface Connection {
    read()
    write(data)
}


export class DebugConnection implements Connection {
    instream: Function;
    outstream: Function;

    constructor(instream: Function = prompt, outstream: Function = console.log) {
        this.instream = instream
        this.outstream = outstream
    }

    read() {
        return this.instream("Input debug read")
    }
    write(data: Uint8Array) {
        this.outstream(data)
    }
}


export class SerialConnection implements Connection {
    ser: SerialPort;
    reader: ReadableStreamBYOBReader;
    writer: WritableStreamDefaultWriter;

    constructor(serialPort: SerialPort) {
        this.ser = serialPort;
        this.reader = this.ser.readable.getReader({ mode: 'byob' });
        this.writer = this.ser.writable.getWriter();
    }

    async read(length: number = 1): Promise<Uint8Array> {
        if (!this.ser.readable)
            throw Error("Serial port is not readable");
        const data = new Uint8Array(length);
        console.log("Serial Read:", bytesToHex(data));
        return data;
    }

    write(data: Uint8Array): Promise<void> {
        if (!this.ser.writable)
            throw Error("Serial port is not writable");
        console.log("Serial Write:", bytesToHex(data))
        return this.writer.write(data);
    }

    async close() {
        await this.writer.ready;
        await this.writer.close();
        this.ser.close();
    }
}