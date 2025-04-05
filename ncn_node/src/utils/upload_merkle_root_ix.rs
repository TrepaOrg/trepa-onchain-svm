//! This module contains functions that build instructions to interact with the trepa program.
use solana_sdk::{
    pubkey::Pubkey,
    instruction::{AccountMeta, Instruction},
    hash::Hash,
};

pub struct ProveResolutionArgs {
    pub proof: Hash,
}
impl ProveResolutionArgs {
    pub fn new(proof: Hash) -> Self {
        Self { proof }
    }
    pub fn proof_bytes(&self) -> Vec<u8> {
        self.proof.to_bytes().to_vec()
    }
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

impl ProveResolutionAccounts {
    /// Convert the accounts into a vector of `AccountMeta` for the instruction.
    pub fn to_account_metas(&self) -> Vec<AccountMeta> {
        vec![
            // This account is expected to be a signer.
            AccountMeta::new(self.merkle_root_upload_authority, true),
            // These are provided as readonly or mutable as required.
            AccountMeta::new_readonly(self.pool, false),
            AccountMeta::new(self.pool_token_account, false),
            AccountMeta::new(self.treasury_token_account, false),
            AccountMeta::new_readonly(self.config, false),
            AccountMeta::new_readonly(self.wsol_mint, false),
            AccountMeta::new_readonly(self.token_program, false),
        ]
    }
}

/// A helper function that creates an instruction to call prove_resolution.
///
/// # Arguments
///
/// * `program_id` - The on-chain program ID to call.
/// * `accounts` - The required account meta information for the call.
/// * `proof` - The number argument that will be passed to the instruction.
pub fn create_prove_resolution_instruction(
    program_id: Pubkey,
    proof: Hash,
    accounts: ProveResolutionAccounts,
) -> Instruction {
    // Create the instruction's argument data.

    let args = ProveResolutionArgs::new(proof);
    let data = args.proof_bytes();
    let account_metas = accounts.to_account_metas();

    Instruction {
        program_id,
        accounts: account_metas,
        data,
    }
}