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
exports.bytesToHex = bytesToHex;
exports.concatBytes = concatBytes;
exports.streamToBytes = streamToBytes;
exports.isEqualBytes = isEqualBytes;
exports.numberToBytes = numberToBytes;
exports.numberToHex = numberToHex;
let chars = "0123456789ABCDEF";
function bytesToHex(data) {
    return Array.from(data, (byte) => {
        return chars[Math.floor(byte / 16)] + chars[byte % 16];
    }).join("").toUpperCase();
}
function concatBytes(chunks) {
    const result = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}
function streamToBytes(stream) {
    return __awaiter(this, void 0, void 0, function* () {
        const chunks = [];
        const reader = stream.getReader();
        while (true) {
            const { done, value } = yield reader.read();
            if (done) {
                break;
            }
            else {
                chunks.push(value);
            }
        }
        return concatBytes(chunks);
    });
}
function isEqualBytes(arr1, arr2) {
    if (arr1.length !== arr2.length)
        return false;
    return arr1.every((value, index) => value === arr2[index]);
}
function numberToBytes(value, size, byteorder) {
    const byteArray = new Uint8Array(size);
    if (byteorder === 'big') {
        for (let index = size - 1; index >= 0; index--) {
            let byte = value & 0xFF;
            byteArray[index] = byte;
            value >>= 8;
        }
    }
    else if (byteorder === 'little') {
        for (let index = 0; index < size; index++) {
            let byte = value & 0xFF;
            byteArray[index] = byte;
            value >>= 8;
        }
    }
    else {
        throw new Error("Byteorder must be either 'big' or 'little'.");
    }
    return byteArray;
}
function numberToHex(value, size, byteorder) {
    return bytesToHex(numberToBytes(value, size, byteorder));
}
//# sourceMappingURL=utils.js.map