// Trepa Social Predictions Platform
// Implementation based on Trepa Whitepaper v0.6.9
// Built for Solana using Anchor framework
#![allow(unexpected_cfgs)]

pub mod context;
pub use context::*;

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};

declare_id!("55VKBiih7w3zNsYsx9LoSzgjXQjm2PW2u2LLJKf6o12e");

#[program]
pub mod trepa {
    use super::*;

    // ===== AUTHORITY FUNCTIONS =====

    /// Initializes the Trepa platform with configurable parameters
    pub fn initialize(
        ctx: Context<Initialize>,
        min_stake: u64,
        max_stake: u64,
        max_roi: u64,  // Represented as basis points (1% = 100)
        platform_fee: u64,       // Basis points
    ) -> Result<()> {
        let config = &mut ctx.accounts.config;

        config.admin = ctx.accounts.admin.key();
        config.min_stake = min_stake;
        config.max_stake = max_stake;
        config.max_roi = max_roi;
        config.platform_fee = platform_fee;
        config.treasury = ctx.accounts.treasury.key();
        config.bump = ctx.bumps.config;

        msg!("Trepa platform initialized");
        Ok(())
    }

    /// Updates the platform parameters
    pub fn update_config(
        ctx: Context<UpdateConfig>,
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
        question: [u8; 16],
        prediction_end_time: i64,
    ) -> Result<()> {

        let pool = &mut ctx.accounts.pool;
        pool.question = question;
        pool.prediction_end_time = prediction_end_time;
        pool.total_stake = 0;
        pool.is_finalized = false;
        pool.bump = ctx.bumps.pool;
        pool.prize_sum = 0;
        pool.is_being_resolved = false;
        pool.proof = 1;

        msg!("Pool created: {}", pool.key());
        Ok(())
    }

    /// Predicts the outcome of a pool
    pub fn predict(
        ctx: Context<Predict>,
        pred: u8,
        stake: u64,  // the intended stake amount
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.total_stake += stake;

        let prediction = &mut ctx.accounts.prediction;
        prediction.pool = pool.key();
        prediction.prediction_value = pred;
        prediction.prize = 0;
        prediction.is_claimed = false;
        prediction.bump = ctx.bumps.prediction;
        prediction.predictor = ctx.accounts.predictor.key();

        // Transfer WSOL from the predictor's token account to the pool's token account
        let cpi_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.predictor_token_account.to_account_info(),
                to: ctx.accounts.pool_token_account.to_account_info(),
                authority: ctx.accounts.predictor.to_account_info(),
            },
        );
        token::transfer(cpi_ctx, stake)?;

        msg!("Prediction made: {} with stake {}", prediction.key(), stake);
        Ok(())
    }     

    /// Start a pool resolution
    pub fn resolve_pool(
        ctx: Context<ResolvePool>,
        prize_amounts: Vec<u64>,
        proof: i64
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        // Check if the pool is not ended 
        // TODO: enable this
        // let current_timestamp = Clock::get()?.unix_timestamp;
        // require!(
        //     current_timestamp >= pool.prediction_end_time,
        //     CustomError::PredictionNotEnded
        // );

        require!(
            !pool.is_being_resolved,
            CustomError::PoolAlreadyBeingResolved
        );
        pool.is_being_resolved = true;
        pool.proof = proof;

        // Get the dynamically passed accounts
        let remaining_accounts = &ctx.remaining_accounts;
        require!(
            remaining_accounts.len() == prize_amounts.len(),
            CustomError::MismatchedPrizeCount
        );

        let mut prize_sum = 0;
        // Process each prediction account dynamically
        for (index, account_info) in remaining_accounts.iter().cloned().enumerate() {
            let mut prediction_acc: PredictionAccount = PredictionAccount::try_deserialize(
                &mut &account_info.data.borrow()[..]
            )?;
            
            require!(
                prediction_acc.pool == pool.key(),
                CustomError::InvalidPool
            );

            prediction_acc.prize = prize_amounts[index];
            //msg!("Updated prize for prediction: {}", prediction_account.prize);
            prediction_acc.try_serialize(&mut &mut account_info.data.borrow_mut()[..])?;

            prize_sum += prediction_acc.prize;
        }

        // Get balance from the pool's token account.
        let balance = ctx.accounts.pool_token_account.amount;
        
        require!(
            balance >= prize_sum, 
            CustomError::InsufficientFunds
        );

        pool.prize_sum = prize_sum;
        
        Ok(())
    }     

    /// Prove and Finalize a pool
    pub fn prove_resolution(
        ctx: Context<ProveResolution>,
        proof: i64,
    ) -> Result<()> {
        let pool = &mut ctx.accounts.pool;

        require!(
            pool.proof == proof,
            CustomError::ProofsDoNotMatch
        );

        pool.is_finalized = true;

        // Since pool is a PDA, create its signer seeds for CPI.
        let pool_seeds: &[&[u8]] = &[
            &b"pool"[..],
            &pool.question[..],
            &[pool.bump],
        ];
        let signer_seeds = &[&pool_seeds[..]];
        // Transfer the remaining balance (balance - prize_sum) from pool token account to treasury token account.
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        );

        // Get balance from the pool's token account.
        let balance = ctx.accounts.pool_token_account.amount;
        token::transfer(cpi_ctx, balance - pool.prize_sum)?;
        
        msg!("Pool resolution proved, pool {} resolved with prize sum {}", pool.key(), pool.prize_sum);
        Ok(())
    }   

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
    ) -> Result<()> {
        let prediction = &mut ctx.accounts.prediction;
        
        let prize = prediction.prize;
        prediction.prize = 0;
        prediction.is_claimed = true;
        
        // Transfer WSOL from the pool's token account to the predictor's token account
        let pool_seeds: &[&[u8]] = &[
            &b"pool"[..],
            &ctx.accounts.pool.question[..],
            &[ctx.accounts.pool.bump]
        ];
        let signer_seeds = &[&pool_seeds[..]];
        
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.predictor_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, prize)?;

        msg!("Reward claimed: {} for prediction {}", prize, prediction.key());
        Ok(())
    }      
}     

#[error_code]
pub enum CustomError {
    #[msg("Prediction not ended")]
    PredictionNotEnded,

    #[msg("Invalid pool")]
    InvalidPool,

    #[msg("Mismatched prize count")]
    MismatchedPrizeCount,   

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Proofs do not match")]
    ProofsDoNotMatch,

    #[msg("Pool already being resolved")]
    PoolAlreadyBeingResolved,
}
