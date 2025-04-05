//! This module contains functions that build instructions to interact with the trepa program.
use anchor_lang::{
    prelude::Pubkey, solana_program::instruction::Instruction, InstructionData, ToAccountMetas,
};

use crate::constants::*;

#[derive(AnchorSerialize, AnchorDeserialize, Debug)]
pub struct ProveResolution {
    pub root: [u8; 32],
}

pub struct ProveResolutionAccounts {
    pub merkle_root_upload_authority: Pubkey,
    pub pool: Pubkey,
    pub pool_token_account: Pubkey,
    pub treasury_token_account: Pubkey,
    pub config: Pubkey,
    pub wsol_mint: Pubkey,
    pub token_program: Pubkey,
}

pub fn upload_merkle_root_ix(
    program_id: Pubkey,
    root: [u8; 32],
    accounts: ProveResolutionAccounts,
) -> Instruction {
    let program_id = PREDICTION_PROGRAM_PUBKEY.load();

    let account_metas = ProveResolutionAccounts {
        merkle_root_upload_authority,
        pool,
        pool_token_account,
        treasury_token_account,
        config,
        wsol_mint,  
        token_program,
    }
    .to_account_metas(None);

    Instruction {
        program_id,
        data: ProveResolution{ root }.data(),
        accounts: account_metas,
    }
}
