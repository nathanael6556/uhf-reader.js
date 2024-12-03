import { bytesToHex, streamToBytes } from "./utils"


export interface Connection {
    read(length: number): Promise<Uint8Array>
    write(data: Uint8Array): void
}


export class DebugConnection implements Connection {
    instream: Function;
    outstream: Function;

    constructor(instream: Function = prompt, outstream: Function = console.log) {
        this.instream = instream
        this.outstream = outstream
    }

    async read(length: number = 1) {
        return this.instream("Input debug read");
    }
    write(data: Uint8Array) {
        this.outstream(data);
    }
}


export class SerialConnection implements Connection {
    ser: SerialPort;

    constructor(serialPort: SerialPort) {
        this.ser = serialPort;
    }

    async read(length: number = 1) {
        if (!this.ser.readable)
            throw Error("Serial port is not readable");

        let reader = this.ser.readable.getReader({ mode: "byob" });

        let data = new Uint8Array(length);
        data = (await reader.read(data)).value;        
        reader.releaseLock();

        return data;
    }

    write(data: Uint8Array): Promise<void> {
        if (!this.ser.writable)
            throw Error("Serial port is not writable");

        let writer = this.ser.writable.getWriter();
        writer.write(data);
        writer.releaseLock();
        return;
    }

    close() {
        this.ser.close()
    }
}