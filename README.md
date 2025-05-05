# solana_example_project
This is a solana example project to demonstrate data, program and native accounts
In this project, I used solana programs to perform mathematical operations on the blockchain.
Solana programs are written in `Rust` while the logic to ping the blockchain is written in `Typescript`. 
Here is how it works:
## File and folder structure
```
├── client (Typescript files to ping our blockchain programs)
│└── main.ts
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
Since instruction_data is an array of u8 bytes, we store it in a different file, hence why we have the extra calculator.rs module.
