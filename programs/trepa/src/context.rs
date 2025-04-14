// ===== ACCOUNT STRUCTURES =====

use anchor_lang::prelude::*;
use anchor_spl::token::{ self, Token, TokenAccount };

#[account]
pub struct ConfigAccount {
    pub admin: Pubkey,        // Admin authority
    pub min_stake: u64,           // Minimum stake amount
    pub max_stake: u64,           // Maximum stake amount
    pub max_roi: u64,             // Maximum ROI in basis points (e.g., 10000 = 100%)
    pub platform_fee: u64,        // Platform fee in basis points
    pub treasury: Pubkey,         // Treasury account to receive platform fees
    pub bump: u8,                 // PDA bump
}

#[account]
pub struct PoolAccount {
    pub question: [u8; 16],         // The prediction question (identifier) always 16 bytes
    pub prediction_end_time: i64,   // When prediction period ends
    pub total_stake: u64,           // Total tokens staked
    pub is_resolved: bool,          // Whether the pool is resolved
    pub is_finalized: bool,         // Whether the pool has been finalized and proved
    pub bump: u8,                   // PDA bump
    pub root: i64,                  // Root of the merkle tree for the pool resolution
}

#[account]
pub struct PredictionAccount {
    pub predictor: Pubkey,          // Predictor's public key
    pub pool: Pubkey,               // Associated spark/pool
    pub prediction_value: u8,       // Predicted "Yes" percentage (0-100)
    //pub stake_amount: u64,          // Amount staked needed for spl tokens
    pub prize: u64,                 // Prize amount
    pub is_claimed: bool,           // Whether rewards have been claimed
    pub bump: u8,                   // PDA bump
}

// ===== CONTEXT STRUCTURES =====

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<ConfigAccount>(),
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ConfigAccount>,
    
    /// CHECK: The treasury is a plain wallet account, and no additional checks are necessary.
    pub treasury: UncheckedAccount<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateConfig<'info> {
    #[account(mut)]
        pub admin: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.admin == admin.key() @ ContextError::Unauthorized
    )]
    pub config: Account<'info, ConfigAccount>,
}

#[derive(Accounts)]
#[instruction(question: [u8; 16], prediction_end_time: i64)]
pub struct CreatePool<'info> {
    #[account(
        mut,
        //constraint = admin.key() == config.admin @ ContextError::Unauthorized
    )]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<PoolAccount>() + 20,  // 8 for the discriminator; fixed size for PoolAccount; 20 bytes for the string (4 for length + 16 max)
        seeds = [b"pool", &question[..]],
        bump,
        constraint = prediction_end_time > clock.unix_timestamp @  ContextError::InvalidEndTime
    )]
    pub pool: Account<'info, PoolAccount>,

    //pub config: Account<'info, ConfigAccount>,
    
    pub system_program: Program<'info, System>,
    pub clock: Sysvar<'info, Clock>,
}

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub predictor: Signer<'info>,
    
    #[account(
        mut,
        constraint = !pool.is_finalized @ ContextError::PoolAlreadyFinalized
    )]
    pub pool: Account<'info, PoolAccount>,
    
    // todo do we need it (for claiming - yes)
    #[account(
        init,
        payer = predictor,
        space = 8 + std::mem::size_of::<PredictionAccount>(),
        seeds = [b"prediction", pool.key().as_ref(), predictor.key().as_ref()], // todo change to Uuid
        bump
    )]
    pub prediction: Account<'info, PredictionAccount>,
    
    #[account(
        mut,
        constraint = predictor_token_account.owner == predictor.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = predictor_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub predictor_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = pool_token_account.owner == pool.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = pool_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    
    pub wsol_mint: Account<'info, token::Mint>,
    
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ResolvePool<'info> {
    #[account(
        mut,
        //constraint = admin.key() == config.admin @ ContextError::Unauthorized
    )]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        constraint = !pool.is_finalized @ ContextError::PoolAlreadyFinalized
    )]
    pub pool: Account<'info, PoolAccount>,

    #[account(
        mut,
        constraint = pool_token_account.owner == pool.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = pool_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,    
    
    #[account(
        mut,
        constraint = treasury_token_account.owner == config.treasury @ ContextError::InvalidTokenAccountOwner,
        constraint = treasury_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub config: Account<'info, ConfigAccount>,  

    pub wsol_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
}   

#[derive(Accounts)]
pub struct ProveResolution<'info> {
    #[account(mut)]
    pub merkle_root_upload_authority: Signer<'info>,
    
    #[account(
        mut,
        constraint = pool.is_resolved @ ContextError::PoolNotResolved
    )]
    pub pool: Account<'info, PoolAccount>,  

    #[account(
        mut,
        constraint = pool_token_account.owner == pool.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = pool_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,   
    
    #[account(
        mut,
        constraint = treasury_token_account.owner == config.treasury @ ContextError::InvalidTokenAccountOwner,
        constraint = treasury_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub treasury_token_account: Account<'info, TokenAccount>,
    
    pub config: Account<'info, ConfigAccount>,

    pub wsol_mint: Account<'info, token::Mint>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub predictor: Signer<'info>,
    
    #[account(
        mut,
        close = predictor,
        constraint = prediction.pool == pool.key() @ ContextError::InvalidPool,
        constraint = !prediction.is_claimed @ ContextError::RewardsAlreadyClaimed,
        constraint = prediction.predictor == predictor.key() @ ContextError::UnauthorizedClaim
    )]
    pub prediction: Account<'info, PredictionAccount>,

    #[account(
        mut,
        constraint = pool.is_finalized @ ContextError::PoolNotFinalized
    )]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        mut,
        constraint = predictor_token_account.owner == predictor.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = predictor_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub predictor_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = pool_token_account.owner == pool.key() @ ContextError::InvalidTokenAccountOwner,
        constraint = pool_token_account.mint == wsol_mint.key() @ ContextError::InvalidMint
    )]
    pub pool_token_account: Account<'info, TokenAccount>,
    
    pub wsol_mint: Account<'info, token::Mint>,
    
    pub token_program: Program<'info, Token>,
}

#[error_code]
pub enum ContextError {
    #[msg("Unauthorized admin action")]
    Unauthorized,

    #[msg("Pool already finalized")]
    PoolAlreadyFinalized,

    #[msg("Invalid pool passed")]
    InvalidPool,

    #[msg("Invalid pool end time")]
    InvalidEndTime,

    #[msg("Rewards already claimed")]
    RewardsAlreadyClaimed,

    #[msg("Unauthorized claim")]
    UnauthorizedClaim,

    #[msg("Invalid mint account")]
    InvalidMint,

    #[msg("Invalid pool token account owner")]
    InvalidTokenAccountOwner,

    #[msg("Pool not finalized")]
    PoolNotFinalized,

    #[msg("Pool not resolved")]
    PoolNotResolved,
}
