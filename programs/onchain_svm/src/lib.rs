use anchor_lang::prelude::*;

declare_id!("E1YMZpRon87eymaLF6kE6GettQS93WFxP1oGaLmrti5q");

#[program]
pub mod onchain_svm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
