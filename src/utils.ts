let chars: string = "0123456789ABCDEF"

export function bytesToHex(data: Uint8Array): string {
    return Array.from(data, (byte) => {
        return chars[Math.floor(byte / 16)] + chars[byte % 16];
    }).join("").toUpperCase();
}

export function concatBytes(chunks: Uint8Array[]): Uint8Array {
    const result = new Uint8Array(chunks.reduce((a, c) => a + c.length, 0));
    let offset = 0;
    for (const chunk of chunks) {
        result.set(chunk, offset);
        offset += chunk.length;
    }
    return result;
}

export async function streamToBytes(stream: ReadableStream<Uint8Array>): Promise<Uint8Array> {
    const chunks: Uint8Array[] = [];
    const reader = stream.getReader();
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
            break;
        } else {
            chunks.push(value);
        }
    }
    return concatBytes(chunks);
}

export function isEqualBytes(arr1: Uint8Array, arr2: Uint8Array): boolean {
    if (arr1.length !== arr2.length)
        return false;
    return arr1.every((value, index) => value === arr2[index]);
}

export function numberToBytes(value: number, size: number, byteorder: string) {
    const byteArray = new Uint8Array(size);

    if (byteorder === 'big') {
        for (let index = size - 1; index >= 0; index--) {
            let byte = value & 0xFF;
            byteArray[index] = byte;
            value >>= 8;
        }
    } else if (byteorder === 'little') {
        for (let index = 0; index < size; index++) {
            let byte = value & 0xFF;
            byteArray[index] = byte;
            value >>= 8;
        }
    } else {
        throw new Error("Byteorder must be either 'big' or 'little'.");
    }

    return byteArray;
}

export function numberToHex(value: number, size: number, byteorder: string) {
    return bytesToHex(numberToBytes(value, size, byteorder));
}