import { numberToBytes } from "./utils"


export function crc16(data: Uint8Array, max_length = Infinity): Uint8Array {
    const PRESET_VALUE = 0xFFFF
    const POLYNOMIAL = 0x8408

    const length = Math.min(max_length, data.length)

    let crc = PRESET_VALUE
    for (let i = 0; i < length; i++) {
        crc ^= data[i]
        for (let i = 0; i < 8; i++) {
            if (crc & 0x0001) {
                crc = (crc >> 1) ^ POLYNOMIAL
            } else {
                crc = (crc >> 1)
            }
        }
    }

    // Convert to little endian
    return numberToBytes(crc, 2, 'little');
}