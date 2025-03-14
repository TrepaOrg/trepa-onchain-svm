// Trepa Social Predictions Platform
// Implementation based on Trepa Whitepaper v0.6.9
// Built for Solana using Anchor framework
use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};
// use std::collections::BTreeMap;

pub mod helpers;
pub mod context;

declare_id!("E1YMZpRon87eymaLF6kE6GettQS93WFxP1oGaLmrti5q");

#[program]
pub mod trepa {
    use super::*;

    // ===== ADMIN FUNCTIONS =====

    /// Initializes the Trepa platform with configurable parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        min_stake: u64,
        max_stake: u64,
        max_roi: u64,  // Represented as basis points (1% = 100)
        platform_fee: u64,       // Basis points
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.authority = ctx.accounts.authority.key();
        config.min_stake = min_stake;
        config.max_stake = max_stake;
        config.max_roi = max_roi;
        config.platform_fee = platform_fee;
        config.treasury = ctx.accounts.treasury.key();
        config.bump = *ctx.bumps.get("config").unwrap();

        msg!("Trepa platform initialized");
        Ok(())
    }

    /// Updates the platform parameters
    pub fn update_parameters(
        ctx: Context<UpdateParameters>,
        min_stake: u64,
        max_stake: u64,
        max_roi: u64,
        platform_fee: u64,
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;
        
        config.min_stake = min_stake;
        config.max_stake = max_stake;
        config.max_roi = max_roi;
        config.platform_fee = platform_fee;

        msg!("Trepa parameters updated");
        Ok(())
    }

    // ===== ADMIN FUNCTIONS =====

    /// Creates a new prediction pool
    pub fn create_pool(
        ctx: Context<CreatePool>,
        question: String,
    ) -> Result<()> {
        // Check that the question string is no longer than 16 bytes
        if question.as_bytes().len() > 16 {
            return Err(CustomError::QuestionTooLong.into());
        }

        let pool = &mut ctx.accounts.pool;
        pool.question = question;
        pool.prediction_end_time = ctx.accounts.prediction_end_time;
        pool.total_stake = 0;
        pool.is_finalized = false;
        Ok(())
    }

    /// Predicts the outcome of a pool
    // TODO: add handler for adding stake  
    pub fn predict(
        ctx: Context<Predict>,
        prediction: u64,
        stake: u64,  // the intended stake amount
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.total_stake += stake;

        let prediction = &mut ctx.accounts.prediction;
        prediction.pool = pool.key();
        prediction.prediction_value = prediction;
        prediction.stake = stake;
        prediction.prize = 0;
        prediction.is_claimed = false;

        // Transfer SOL from the predictor to the pool accoun
        let cpi_ctx = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            system_program::Transfer {
                from: ctx.accounts.predictor.to_account_info(),
                to: ctx.accounts.pool.to_account_info(),
            },
        );
        system_program::transfer(cpi_ctx, stake)?;
        Ok(())
    }     

    /// Finalizes a pool
    // TODO: add handler for distributing rewards
    pub fn finalize_pool(
        ctx: Context<FinalizePool>,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        let current_timestamp = Clock::get()?.unix_timestamp;
        if current_timestamp < pool.prediction_end_time {
            return Err(CustomError::PredictionNotEnded.into());
        }

        // Check if the pool is already finalized
        if pool.is_finalized {
            return Err(CustomError::PoolAlreadyFinalized.into());
        }

        // Working with winner accounts 
        // Get the dynamically passed accounts
        let remaining_accounts = &ctx.remaining_accounts;

        require!(
            remaining_accounts.len() == prize_amounts.len(),
            AccountError::MismatchedPrizeCount
        );

        // Process each prediction account dynamically
        for (i, account_info) in remaining_accounts.iter().enumerate() {
            let mut prediction_account: Account<PredictionAccount> =
                Account::try_from(account_info)?;
            
            require!(
                prediction_account.pool == pool.key(),
                AccountError::InvalidPool
            );

            prediction_account.prize = prize_amounts[i];
            //msg!("Updated prize for prediction: {}", prediction_account.prize);
        }

        msg!("Finalized pool: {}", pool.key());

        pool.is_finalized = true;
        Ok(())
    }           
}     

#[error_code]
pub enum CustomError {
    #[msg("Config account already exists.")]
    ConfigAlreadyExists,

    #[msg("Question string is too long. Maximum allowed is 16 bytes.")]
    QuestionTooLong,

    #[msg("Prediction not ended")]
    PredictionNotEnded,

    #[msg("Pool already finalized")]
    PoolAlreadyFinalized,

    #[msg("Invalid pool")]
    InvalidPool,

    #[msg("Mismatched prize count")]
    MismatchedPrizeCount,   
}
