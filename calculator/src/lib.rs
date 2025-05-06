use borsh::{BorshDeserialize, BorshSerialize};
use solana_program::{
    pubkey::Pubkey,
    program_error::ProgramError,
    msg,
    entrypoint,
    entrypoint::ProgramResult,
    account_info::{next_account_info, AccountInfo}
};

mod calculator;
use calculator::*;

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct CalculatorElement {
    pub value: u32
}

entrypoint!(process_instruction);

fn process_instruction(program_id: &Pubkey, accounts: &[AccountInfo], instruction_data: &[u8]) -> ProgramResult {
    let accounts_iter = &mut accounts.iter();
    let account = next_account_info(accounts_iter)?;

    if account.owner != program_id {
        msg!("Account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Debug output:");
    msg!("Account ID: {}", account.key);
    msg!("Executable? : {}", account.executable);
    msg!("Lamports: {:#?}", account.lamports);
    msg!("Debug output complete");

    msg!("Calculating the operation...");

    let mut calc = CalculatorElement::try_from_slice(&account.data.borrow())?;
    let calculator_instructions = CalculatorInstructions::try_from_slice(&instruction_data)?;

    calc.value = calculator_instructions.evaluate(calc.value); 

    calc.serialize(&mut &mut account.data.borrow_mut()[..])?; // serialize into the account and save as new state


    msg!("Value is now: {}", calc.value);

    Ok(())
}