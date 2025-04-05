//! This module contains functions that build instructions to interact with the trepa program.
use solana_sdk::{
    pubkey::Pubkey,
    instruction::Instruction,  // Use the Instruction from solana_sdk
};
use anchor_lang::{InstructionData, ToAccountMetas};
use anchor_lang::prelude::{AccountMeta};

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

impl ToAccountMetas for ProveResolutionAccounts {
    fn to_account_metas(&self, _program_id: Option<&Pubkey>) -> Vec<AccountMeta> {
        vec![
            // Assume the upload authority must be a signer and mutable:
            AccountMeta::new(self.merkle_root_upload_authority, true),
            // The rest may be read-only or mutable as needed:
            AccountMeta::new_readonly(self.pool, false),
            AccountMeta::new(self.pool_token_account, false),
            AccountMeta::new(self.treasury_token_account, false),
            AccountMeta::new_readonly(self.config, false),
            AccountMeta::new_readonly(self.wsol_mint, false),
            AccountMeta::new_readonly(self.token_program, false),
        ]
    }
}

pub fn upload_merkle_root_ix(
    program_id: Pubkey,
    root: [u8; 32],
    accounts: ProveResolutionAccounts,
) -> Instruction {

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
        data: InstructionData { root }.data(),
        accounts: account_metas,
    }
}