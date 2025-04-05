//! This module contains functions that build instructions to interact with the trepa program.
use solana_sdk::{
    pubkey::Pubkey,
    instruction::{AccountMeta, Instruction},
    hash::Hash,
};
use sha2::{Sha256, Digest};

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
            AccountMeta::new(self.pool, false),
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
    _proof: Hash,
    accounts: ProveResolutionAccounts,
) -> Instruction {
    // Compute the instruction discriminator for "prove_resolution"
    let mut hasher = Sha256::new();
    hasher.update("global:prove_resolution".as_bytes());
    let hash = hasher.finalize();
    let mut discriminator = [0u8; 8];
    discriminator.copy_from_slice(&hash[..8]);

    //let args = ProveResolutionArgs::new(proof);
    //let data = args.proof_bytes();
    let proof: i64 = 0;
    let proof_bytes = proof.to_le_bytes().to_vec();

    let mut data = Vec::with_capacity(discriminator.len() + proof_bytes.len());
    data.extend_from_slice(&discriminator);
    data.extend_from_slice(&proof_bytes);

    Instruction {
        program_id,
        accounts: accounts.to_account_metas(),
        data,
    }
}