use anchor_lang::prelude::Pubkey;
use once_cell::sync::Lazy;
use std::str::FromStr;

/// Treasury token account identifier (as string).
pub const TREASURY_TOKEN_ACCOUNT: &str = "6pSTqcVeZNJMRFRMZdjCaYRaCg5z3FsdZNYmjpfRq9Sm";

// WSOL mint address (same on all networks)
pub const WSOL_MINT: &str = "So11111111111111111111111111111111111111112";

/// Token program identifier (as string).
pub const TOKEN_PROGRAM: &str = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

/// Prediction program identifier.
pub const PREDICTION_PROGRAM: &str = "55VKBiih7w3zNsYsx9LoSzgjXQjm2PW2u2LLJKf6o12e";

// Programm config account
pub const CONFIG_ACCOUNT: &str = "";

/// Parsed Treasury Token Account as a Pubkey.
pub static TREASURY_TOKEN_ACCOUNT_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(TREASURY_TOKEN_ACCOUNT)
        .expect("Invalid TREASURY_TOKEN_ACCOUNT pubkey")
});

/// Parsed Config Account as a Pubkey.
pub static CONFIG_ACCOUNT_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(CONFIG_ACCOUNT).expect("Invalid CONFIG_ACCOUNT pubkey")
});

/// Parsed WSOL Mint as a Pubkey.
pub static WSOL_MINT_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(WSOL_MINT).expect("Invalid WSOL_MINT pubkey")
});

/// Parsed Token Program as a Pubkey.
pub static TOKEN_PROGRAM_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(TOKEN_PROGRAM).expect("Invalid TOKEN_PROGRAM pubkey")
});

/// Parsed Prediction Program as a Pubkey.
pub static PREDICTION_PROGRAM_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(PREDICTION_PROGRAM).expect("Invalid PREDICTION_PROGRAM pubkey")
});

/// Parsed Program Config Account as a Pubkey.
pub static CONFIG_ACCOUNT_PUBKEY: Lazy<Pubkey> = Lazy::new(|| {
    Pubkey::from_str(CONFIG_ACCOUNT).expect("Invalid CONFIG_ACCOUNT pubkey")
});









