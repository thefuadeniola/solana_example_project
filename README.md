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
We start with the package.json file by running npm init, to give us barebones of the projects. For this project use [this package.json file](https://github.com/thefuadeniola/solana_example_project/blob/main/package.json)
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
This is just a file containing scripts to connect npm to cargo. If you are following this same file structure, use paste [this](https://github.com/thefuadeniola/solana_example_project/blob/main/scripts/cicd.sh) into your scripts/cicd.sh.

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
The full list of util.ts functions including the more verbose functions is [here](https://github.com/thefuadeniola/solana_example_project/blob/main/client/util.ts)

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
After connecting to the devnet, the more verbose functions include: 
-> fetch local machine pubkey and aidrop sol if needed (from `CONFIG_FILE_PATH`)
-> fetching programId from `PROGRAM_PATH`
-> creating a `clientPubKey` owned by our program which we can read/write to
-> pinging our program with `pingProgram`
-> calling all the functions under the `example` function

The full main.ts file is [here](https://github.com/thefuadeniola/solana_example_project/blob/main/client/main.ts)

Finally, we create one more file, calculator.ts where we construct the struct with an initial value of 0, serialize (using borsh) it into an `accountSpaceSize` and pass it as a parameter to calling our `example()`
function. So that our `clientPubKey` account now holds calculator data:
```
class Calculator {
    value = 0;
    constructor(fields: {value: number} | undefined = undefined) {
        if(fields){
            this.value = fields.value
        }
    }
}

const CalculatorSchema = new Map([
    [Calculator, { kind: 'struct', fields: [['value', 'u32']] }]
]);

const CALCULATOR_SIZE = borsh.serialize(
    CalculatorSchema,
    new Calculator()
).length;

```

Finally, we call the function and handle the success and error cases. Full calculator.ts file is [here](https://github.com/thefuadeniola/solana_example_project/blob/main/client/calculator.ts). And there it is. Our onchain calculator is now up and running!
