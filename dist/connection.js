"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SerialConnection = exports.DebugConnection = void 0;
const utils_1 = require("./utils");
class DebugConnection {
    constructor(instream = prompt, outstream = console.log) {
        this.instream = instream;
        this.outstream = outstream;
    }
    read() {
        return this.instream("Input debug read");
    }
    write(data) {
        this.outstream(data);
    }
}
exports.DebugConnection = DebugConnection;
class SerialConnection {
    constructor(serialPort) {
        this.ser = serialPort;
        this.reader = this.ser.readable.getReader({ mode: 'byob' });
        this.writer = this.ser.writable.getWriter();
    }
    read() {
        return __awaiter(this, arguments, void 0, function* (length = 1) {
            if (!this.ser.readable)
                throw Error("Serial port is not readable");
            const data = new Uint8Array(length);
            console.log("Serial Read:", (0, utils_1.bytesToHex)(data));
            return data;
        });
    }
    write(data) {
        if (!this.ser.writable)
            throw Error("Serial port is not writable");
        console.log("Serial Write:", (0, utils_1.bytesToHex)(data));
        return this.writer.write(data);
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.writer.ready;
            yield this.writer.close();
            this.ser.close();
        });
    }
}
exports.SerialConnection = SerialConnection;
//# sourceMappingURL=connection.js.map