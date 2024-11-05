"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crc16 = crc16;
const utils_1 = require("./utils");
function crc16(data, max_length = Infinity) {
    const PRESET_VALUE = 0xFFFF;
    const POLYNOMIAL = 0x8408;
    const length = Math.min(max_length, data.length);
    let crc = PRESET_VALUE;
    for (let i = 0; i < length; i++) {
        crc ^= data[i];
        for (let i = 0; i < 8; i++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ POLYNOMIAL;
            }
            else {
                crc = (crc >> 1);
            }
        }
    }
    // Convert to little endian
    return (0, utils_1.numberToBytes)(crc, 2, 'little');
}
//# sourceMappingURL=crc.js.map