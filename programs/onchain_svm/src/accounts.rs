// ===== ACCOUNT STRUCTURES =====

use anchor_lang::prelude::*;

#[account]
pub struct ConfigAccount {
    pub authority: Pubkey,        // Admin authority
    pub min_stake: u64,           // Minimum stake amount
    pub max_stake: u64,           // Maximum stake amount
    pub max_roi: u64,             // Maximum ROI in basis points (e.g., 10000 = 100%)
    pub platform_fee: u64,        // Platform fee in basis points
    pub treasury: Pubkey,         // Treasury account to receive platform fees
    pub bump: u8,                 // PDA bump
}

#[account]
pub struct PoolAccount {
    pub question: String,           // The prediction question (identifier) always 16 bytes
    pub prediction_end_time: i64,   // When prediction period ends
    pub total_stake: u64,           // Total tokens staked
    pub is_finalized: bool,         // Whether the spark has been finalized
    pub bump: u8,                   // PDA bump
}

#[account]
pub struct PredictionAccount {
    //pub predictor: Pubkey,          // Predictor's public key
    pub pool: Pubkey,               // Associated spark/pool
    pub prediction_value: u8,       // Predicted "Yes" percentage (0-100)
    //pub stake_amount: u64,          // Amount staked needed for spl tokens
    pub is_claimed: bool,           // Whether rewards have been claimed
    pub bump: u8,                   // PDA bump
}

// ===== CONTEXT STRUCTURES =====

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        init,
        payer = authority,
        space = 8 + std::mem::size_of::<ConfigAccount>(),
        seeds = [b"config"],
        bump
    )]
    pub config: Account<'info, ConfigAccount>,
    
    pub treasury: Account<'info, TokenAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdateParameters<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"config"],
        bump = config.bump,
        constraint = config.authority == authority.key() @ AccountError::Unauthorized
    )]
    pub config: Account<'info, ConfigAccount>,
}

#[derive(Accounts)]
pub struct CreatePool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + std::mem::size_of::<PoolAccount>() + 20, // 8 bytes for the discriminator, fixed size for PoolAccount, and 20 bytes for the string (4 for length + 16 max)
        seeds = [b"pool", question.as_bytes()],
        bump
    )]
    pub pool: Account<'info, PoolAccount>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Predict<'info> {
    #[account(mut)]
    pub predictor: Signer<'info>,
    
    #[account(
        mut,
        constraint = !pool.is_finalized @ AccountError::PoolAlreadyFinalized
    )]
    pub pool: Account<'info, PoolAccount>,
    
    #[account(
        init,
        payer = predictor,
        space = 8 + std::mem::size_of::<PredictionAccount>(),
        seeds = [b"prediction", pool.key().as_ref(), predictor.key().as_ref()],
        bump
    )]
    pub prediction: Account<'info, PredictionAccount>,
    
    // for spl tokens
    // #[account(mut)]
    // pub predictor_token_account: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizePool<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        mut,
        constraint = !pool.is_finalized @ AccountError::PoolAlreadyFinalized
    )]
    pub pool: Account<'info, PoolAccount>,
}   

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub predictor: Signer<'info>,
    
    #[account(
        mut,
        constraint = prediction.pool == pool.key() @ AccountError::InvalidPool
    )]
    pub prediction: Account<'info, PredictionAccount>,

    pub pool: Account<'info, PoolAccount>,
}

#[error_code]
pub enum AccountError {
    #[msg("Unauthorized update")]
    Unauthorized,

    #[msg("Pool already finalized")]
    PoolAlreadyFinalized,

    #[msg("Invalid pool")]
    InvalidPool,
}
