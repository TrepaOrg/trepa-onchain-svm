// Trepa Social Predictions Platform
// Implementation based on Trepa Whitepaper v0.6.9
// Built for Solana using Anchor framework
use anchor_lang::prelude::*;
// use anchor_spl::token::{self, Token, TokenAccount, Transfer};
// use std::collections::BTreeMap;

pub mod helpers;
pub mod accounts;

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
}       

#[error_code]
pub enum CustomError {
    #[msg("Config account already exists.")]
    ConfigAlreadyExists,
}
