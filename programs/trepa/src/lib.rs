// Trepa Social Predictions Platform
// Implementation based on Trepa Whitepaper v0.6.9
// Built for Solana using Anchor framework
#![allow(unexpected_cfgs)]

pub mod context;
pub use context::*;

use anchor_lang::prelude::*;
use anchor_spl::token::{self, Transfer};
use solana_program::hash::hash; // Using SHA256 from Solana's SDK

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
        pool.is_resolved = false;
        pool.root = [0u8; 32];

        msg!("Pool created: {}", pool.key());
        Ok(())
    }

    /// Start a pool resolution
    pub fn resolve_pool(
        ctx: Context<ResolvePool>,
        merkle_root: [u8; 32], 
        protocol_fee: u64,
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
            !pool.is_resolved,
            CustomError::PoolAlreadyBeingResolved
        );
        
        // Get balance from the pool's token account.
        let balance = ctx.accounts.pool_token_account.amount;
        require!(
            balance >= protocol_fee, 
            CustomError::InsufficientFunds
        );

        pool.is_resolved = true;
        pool.root = merkle_root;

        // Since pool is a PDA, create its signer seeds for CPI.
        let pool_seeds: &[&[u8]] = &[
            &b"pool"[..],
            &pool.question[..],
            &[pool.bump],
        ];
        let signer_seeds = &[&pool_seeds[..]];
        // Transfer the protocol fee from pool token account to treasury token account.
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.treasury_token_account.to_account_info(),
                authority: pool.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(cpi_ctx, protocol_fee)?;
        
        Ok(())
    }     

    // ===== USER FUNCTIONS =====

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
        prediction.is_claimed = false;
        prediction.bump = ctx.bumps.prediction;

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

    /// Claim the rewards for a prediction
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        amount: u64,
        proof: Vec<[u8; 32]>,
    ) -> Result<()> {
        // Compute the leaf as SHA256(address || amount)
        let predictor_bytes = ctx.accounts.predictor.key().to_bytes(); // 32 bytes
        let amount_bytes = amount.to_le_bytes(); // 8 bytes

        let mut data = [0u8; 40];
        data[..32].copy_from_slice(&predictor_bytes);
        data[32..].copy_from_slice(&amount_bytes);

        let leaf = hash(&data).to_bytes();

        let mut computed_hash = leaf;
        for node in proof.iter() {
            let mut combined = [0u8; 64];
            // Ensure lexicographical order before hashing.
            if computed_hash <= *node {
                combined[..32].copy_from_slice(&computed_hash);
                combined[32..].copy_from_slice(node);
            } else {
                combined[..32].copy_from_slice(node);
                combined[32..].copy_from_slice(&computed_hash);
            }
            computed_hash = hash(&combined).to_bytes();
        }

        require!(
            computed_hash == ctx.accounts.pool.root,
            CustomError::InvalidProof
        );

        let prediction = &mut ctx.accounts.prediction;
        prediction.is_claimed = true;

        // Transfer WSOL from the pool's token account to the predictor's token account.
        let pool_seeds: &[&[u8]] = &[
            b"pool",
            &ctx.accounts.pool.question,
            &[ctx.accounts.pool.bump],
        ];
        let signer_seeds = &[pool_seeds];
        let cpi_ctx = CpiContext::new_with_signer(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.pool_token_account.to_account_info(),
                to: ctx.accounts.predictor_token_account.to_account_info(),
                authority: ctx.accounts.pool.to_account_info(),
            },
            signer_seeds,
        );
        token::transfer(cpi_ctx, amount)?;

        msg!("Reward claimed: {} for prediction {}", amount, prediction.key());
        Ok(())
    }      
}     

// using Solana’s built‑in SHA256 hash function. In this example, the predictor’s 32-byte public key is concatenated with the 8-byte little‑endian representation of the amount into a 40‑byte buffer. Then the function iteratively hashes the leaf together with each proof node (sorting the two inputs lexicographically before hashing) until a final computed hash is produced. This final hash is then required to match the stored Merkle root. (It is assumed that your pool account now stores 
//     root
//     root as a 
//     [
//     u
//     8
//     ;
//     32
//     ]
//     [u8;32].)


#[error_code]
pub enum CustomError {
    #[msg("Prediction not ended")]
    PredictionNotEnded,

    #[msg("Insufficient funds")]
    InsufficientFunds,

    #[msg("Pool already being resolved")]
    PoolAlreadyBeingResolved,

    #[msg("Invalid proof")]
    InvalidProof,
}
