import { bytesToHex, streamToBytes } from "./utils"


export interface Connection {
    read()
    write(data)
}


export class DebugConnection implements Connection {
    instream: Function;
    outstream: Function;

    constructor(instream:Function = prompt, outstream:Function = console.log) {
        this.instream = instream
        this.outstream = outstream
    }

    read() {
        return this.instream("Input debug read")
    }
    write(data:Uint8Array) {
        this.outstream(data)
    }
}


export class SerialConnection implements Connection {
    ser: SerialPort;
    reader: ReadableStreamDefaultReader;
    writer: WritableStreamDefaultWriter ;

    constructor(serialPort: SerialPort) {
        this.ser = serialPort;
        this.reader = this.ser.readable.getReader();
    }
    
    async read(): Promise<Uint8Array> {
        if (!this.ser.readable)
            throw Error("Serial port is not readable");
        const data = await streamToBytes(this.ser.readable);
        console.log("Serial Read:", data)
        return data
    }

    write(data:Uint8Array): Promise<void> {
        if (!this.ser.writable)
            throw Error("Serial port is not writable");
        console.log("Serial Write:", bytesToHex(data))
        return this.writer.write(data);
    }

    close() {
        this.ser.close()
    }
}