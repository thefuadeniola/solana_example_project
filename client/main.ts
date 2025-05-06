import { Keypair, Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, TransactionInstruction, sendAndConfirmTransaction, SystemProgram } from '@solana/web3.js'
import { createCalculatorInstructions, createKeypairFromFile, getStringForInstruction } from './util';
import os from 'os';
import { fs } from 'mz';
import path from "path";
import yaml from 'yaml';

// point the client to your local machine account
const CONFIG_FILE_PATH = path.resolve(
    os.homedir(),
    '.config',
    'solana',
    'cli',
    'config.yml'
);

// initialize and specify types
let connection: Connection;
let localKeypair: Keypair;
let programKeypair: Keypair;
let programId: PublicKey;
let clientPubKey: PublicKey;

// point the ts file to your compiled program outputs
const PROGRAM_PATH = path.resolve(__dirname, '../dist/program');

// connect to devnet
export async function connect() {
    connection = new Connection("https://api.devnet.solana.com", 'confirmed');

    console.log("Successfully connected to Solana dev net");
}

// fetch local account from CONFIG_FILE_PATH which is a .yaml file & request airdrop if needed
export async function getLocalAccount() {
    const configYml = await fs.readFile(CONFIG_FILE_PATH, {encoding: 'utf8'});
    const keypairPath = yaml.parse(configYml).keypair_path;
    localKeypair = await createKeypairFromFile(keypairPath);

/*     const airdropRequest = await connection.requestAirdrop(
        localKeypair.publicKey,
        LAMPORTS_PER_SOL*2
    );

    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    await connection.confirmTransaction({
        signature: airdropRequest,
        blockhash,
        lastValidBlockHeight
    })
*/
    console.log("Local account loaded successfully");
    console.log("Local account's address is:");
    console.log(`   ${localKeypair.publicKey}`);
}

// get the targeted program from PROGRAM_PATH

export async function getProgram() {
    programKeypair = await createKeypairFromFile(
        path.join(PROGRAM_PATH, 'calculator' + '-keypair.json')
    );
    programId = programKeypair.publicKey;

    console.log(`we're goinhg to ping the calculator program`);
    console.log("It's program ID is:");
    console.log(`   ${programId.toBase58()}`)
}

// create and configure a client account owned by this program that we can write/edit its data
export async function configureClientAccount(accountSpaceSize: number) {
    const SEED = `test1`; // creating with a seed
    clientPubKey = await PublicKey.createWithSeed(
        localKeypair.publicKey,
        SEED,
        programId
    );

    console.log('We have created an address using a seed: test1');
    console.log(`The generated address is: ${clientPubKey.toBase58()}`);

    const clientAccount = await connection.getAccountInfo(clientPubKey);
    if(clientAccount === null) {
        const transaction = new Transaction().add(
            SystemProgram.createAccountWithSeed({
                fromPubkey: localKeypair.publicKey,
                basePubkey: localKeypair.publicKey,
                seed: SEED,
                newAccountPubkey: clientPubKey,
                lamports: LAMPORTS_PER_SOL,
                space: accountSpaceSize,
                programId
            })
        );

        await sendAndConfirmTransaction(connection, transaction, [localKeypair]);        
    }
}

export async function pingProgram(operation: number, operatingValue: number) {
    console.log(`All right, let's run it`);
    console.log('Pinging our calculator program...');

    let calcInstructions = await createCalculatorInstructions(operation, operatingValue);

    console.log(`We're going to ${await getStringForInstruction(operation, operatingValue)}`)

    const instruction = new TransactionInstruction({
        keys: [{pubkey: clientPubKey, isSigner: false, isWritable: true}],
        programId,
        data: calcInstructions
    });

    console.log

    await sendAndConfirmTransaction(
        connection,
        new Transaction().add(instruction),
        [localKeypair]
    );

    console.log('Ping successful.')
}

export async function example(accountSpaceSize: number) {
    await connect();
    await getLocalAccount();
    await getProgram();
    await configureClientAccount(accountSpaceSize);
    await pingProgram(1, 2);
}

/*
-> point to local config
-> initialize variable and set types
-> point to compiled program files
-> connection function
-> fetch local machine pubkey and aidrop sol if needed
-> fetch programId from deployed program write path
-> configure clientAccount with which we will:
-> ping the program
-> call all functions under one umbrella
 */