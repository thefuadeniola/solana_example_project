import { Keypair } from "@solana/web3.js";
import {fs} from 'mz';
import * as BufferLayout from '@solana/buffer-layout';

export async function createKeypairFromFile(filePath: string): Promise<Keypair> {
    const secretKeyString = await fs.readFile(filePath, {encoding: 'utf8'});
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

    return Keypair.fromSecretKey(secretKey);
}
// fetch secretKeyString -> parse into secretKey -> return Keypair

export async function getStringForInstruction(operation: number, operating_value: number) {
    if (operation == 0) {
        return "reset the example.";
    } else if (operation == 1) {
        return `add: ${operating_value}`;
    } else if (operation == 2) {
        return `subtract: ${operating_value}`;
    } else if (operation == 3) {
        return `multiply by: ${operating_value}`
    }
}

export async function createCalculatorInstructions(operation: number, operatingValue: number): Promise<Buffer> {
    const bufferLayout: BufferLayout.Structure<any> = BufferLayout.struct(
        [
            BufferLayout.u32('operation'),
            BufferLayout.u32('operating_value')
        ]
    );

    const buffer = Buffer.alloc(bufferLayout.span);
    bufferLayout.encode({
        operation: operation,
        operating_value: operatingValue
    }, buffer);

    return buffer;
}

