# solana_example_project
This is a solana example project to demonstrate data, program and native accounts
In this project, I used solana programs to perform mathematical operations on the blockchain.
Solana programs are written in `Rust` while the logic to ping the blockchain is written in `Typescript`. 
Here is how it works:
## File and folder structure
```
├── client (Typescript files to ping our blockchain programs)
│└── main.ts
|└── util.ts
|└── calculator.ts
├── dist (target folder for all output files)
├── scripts (this is where I define how npm accesses and interacts with rust files)
├── calculator
│└── src
| └──lib.rs (all rust logic for a single program)
| └── calculator.rs
│└── cargo.toml 
├── node_modules
├── package.json
└── package-lock.json
```
We start with the package.json file by running npm init, to give us barebones of the projects. For this project use [this package.json file](https://github.com/Coding-and-Crypto/Rust-Solana-Tutorial/blob/master/math-stuff/package.json)
Now that overall dependencies are done,
 ## Rust dependencies
 We use borsh for serializing/deserializing data, borsh-derive and solana-program for everything solana. Add the following to your cargo.toml file and run `cargo build` in a terminal pointing to the directory where you have your cargo.toml file
 ```
[package]
name = "calculator"
version = "0.1.0"
edition = "2021"

[dependencies]
solana-program = "1.9.0"
borsh = "0.9.3"
borsh-derive = "0.9.1"

[dev-dependencies]
solana-program-test = "1.9.0"
solana-sdk = "1.9.9"

[lib]
crate-type = ["cdylib", "lib"]
```

## Rust files
In our rust files (lib.rs, calculator.rs), we write the blockchain logic. In lib.rs, after importing all use statements, we specify the entrypoint using the entrypoint macro.
All solana programs must have one entrypoint. In this case `entrypoint!(process_instruction)`
`process_instruction` is our overall function with the following signature: 
```
fn process_instruction(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult;
```
In this function, we write in rust whatever we want our program to do on the blockchain.
### program_id
public key of the deployed program
### accounts
array of accounts our project can possibly read/write from
### instruction_data
additional instructions we want to pass to our program

## Scripts
This is just a file containing scripts to connect npm to cargo. If you are following this same file structure, use paste [this](https://github.com/Coding-and-Crypto/Rust-Solana-Tutorial/blob/master/math-stuff/scripts/cicd.sh) into your scripts/cicd.sh. *change this after deploying yours*

## Typescript client files
In our main.ts, we write the step by step process by which we create the data account we will interact with (this is because solana does not allow a program write to or edit data of an account it does not own);
and how we ping our program.
### util.ts
In the util.ts, we write the utility function to `createKeypairFromFile`. We will potentially need to create key pairs to get our program id, local keypair, etc. client/util.ts:
```
import { Keypair } from "@solana/web3.js";
import {fs} from 'mz';

export async function createKeypairFromFile(filePath: string): Promise<Keypair> {
    const secretKeyString = await fs.readFile(filePath, {encoding: 'utf8'});
    const secretKey = Uint8Array.from(JSON.parse(secretKeyString));

    return Keypair.fromSecretKey(secretKey);
}
```
The full list of util.ts functions including the more verbose functions is [here](https://github.com/Coding-and-Crypto/Rust-Solana-Tutorial/blob/master/advanced-math/src/client/util.ts)

### main.ts
This is the engine room of the project. We start by pointing the util.ts file to our local machine keypair. This is the keypair account that will be used to deploy this program (owner)
```
ts
const CONFIG_FILE_PATH = path.resolve(
 os.homedir(),
.config,
solana,
cli,
config.yml
) 
```

We then create some variables and assign them to the types we imported from `'@solana/web3'`
```
let connection: Connection;
let localKeypair: Keypair;
let programKeypair: Keypair;
let programId: Pubkey;
let clientPubKey: Pubkey
```

Then we point the ts file to the directory of our compiled program.so files. (Wherever the rust compiler outputted the compiled program files). In this case:
```
const PROGRAM_PATH = path.resolve(__dirname, '../../dist/program');
```

Next, we write the function to connect to the api (devnet in this case) and set the connection to the `connection` variable.
```
ts
export async function connect() {
    connection = new Connection("https://api.devnet.solana.com", 'confirmed');

    console.log("Successfully connected to Solana dev net");
}
```
The next thing we do is to get the local machine account from the `CONFIG_FILE_PATH` variable and send some devnet solana to its public key if needed. We do the same reading of file using `fs.readFromFile()` and then `createKeypairFromFile()`. The only difference
here is that the filepath is a .yaml. So after reading the file and before creating the keypair, we add this line:
`const keypairPath = yaml.parse(configYml).keypair_path;

If needed, we can request airdrop from the devnet to add solana to our account: 
```
ts
const airdropRequest =  connection.requestAirdrop(
 localKeypair.publicKey, LAMPORTS_PER_SOL*2 // LAMPORTS_PER_SOL is imported from solana/web3.js and it refers to the amounts of lamports in a sol. lamport is the smallest unit of solana.
)
// To differentiate each transaction and prevent duplication, solana requires that we add the latest blockhash and the latest block height.
const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
    await connection.confirmTransaction({
        signature: airdropRequest,
        blockhash,
        lastValidBlockHeight
}) 
```

We get the programId (public key of the deployed programs) through another series of reading file paths. To parse the programId into a readable string, we use `programId.toBase58()`. This applies
to any variable of type Pubkey.
Next, we configure a client account from inside our project. This will mean that this created account is owned by our program, and we can read/write to it. It can also ping our program.
```
ts
export async function configureClientAccount(spaceSize: number) {
 // the fastest way to get a pubkey is simply to create it with a seed.
 let SEED = 'test1'
 clientPubkey = await Pubkey.createWithSeed(localKeypair.publicKey, SEED, programId);
}
// check if public key created does not already contain data. If null:
   const clientAccount = await connection.getAccountInfo(clientPubKey);
   if(clientAccount === null) {
       const transaction = new Transaction().add(
           SystemProgram.createAccountWithSeed({
               fromPubkey: localKeypair.publicKey,
               basePubkey: localKeypair.publicKey,
               seed: SEED,
               newAccountPubkey: clientPubKey,
               lamports: LAMPORTS_PER_SOL,
               space: spaceSize,
               programId
           })
    await sendAndConfirmTransaction(connection, transaction, [localKeypair])
       );
 
```
