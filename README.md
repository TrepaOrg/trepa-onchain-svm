# Trepa OnChain

**Trepa OnChain** is a collection of on-chain programs and off-chain binaries designed to manage merkle-root resolution for distributing rewards on Solana. It leverages asynchronous off-chain workflows for generating, signing, and uploading merkle proofs while using an Anchor-based on-chain program to process and verify these proofs.

## Table of Contents

- [Overview](#overview)
- [Folder Structure](#folder-structure)
- [Getting Started](#getting-started)
- [Building and Running](#building-and-running)
- [Contributing](#contributing)
- [License](#license)

## Overview

The repository contains both client-side (off-chain) code and on-chain Solana programs. Off-chain components are responsible for:
  
- Listening for on-chain events.
- Reading and processing merkle-tree data.
- Constructing and sending transactions to the Solana RPC endpoint.

The on-chain program validates proofs and finalizes pool resolution using account constraints and instruction handlers built with Anchor.

## Folder Structure

- **ncn_node/**  
  This folder includes the off-chain client and workflow components.

  - **Cargo.toml**  
    The workspace and package configuration for the off-chain binaries.

  - **src/**  
    Contains all the off-chain source code.
    
    - **bin/**  
      Executable binaries such as `merkle-root-uploader.rs` that wait for specific on-chain events (e.g., log messages) and trigger transaction uploads.
    
    - **merkle_root_upload_workflow.rs**  
      Implements the asynchronous workflow to read merkle tree JSON files, create transactions (by calling helper functions), and upload merkle roots after the required events are detected.
    
    - **utils/**  
      Helper modules including `upload_merkle_root_ix.rs` for creating the instruction payloads (discriminator, proof, etc.) used by the on-chain program.
    
    - **constants/** (if present)  
      Contains configuration constants such as public keys and token program addresses used by the workflow.

- **programs/trepa/**  
  This folder houses the on-chain program built using Anchor.

  - **src/**  
    Contains the on-chain source code.
    
    - **lib.rs**  
      The entry point for the on-chain program, handling instruction dispatch and state management.
    
    - **context.rs**  
      Defines account contexts and constraints for instructions (e.g., pool resolution, proof verification).
    
    - Other modules that define state structures and helper functions following Anchor coding patterns.

- **target/**  
  Generated output files including the IDL (Interface Description Language) JSON file (e.g., `trepa.json`) and TypeScript types for client integrations.

## Getting Started

1. **Clone the Repository**

   ```bash
   git clone https://github.com/TrepaOrg/trepa-onchain-svm.git
   cd trepa-onchain-svm
   ```

2. **Install Dependencies**

   Make sure you have the following installed:
   
   - Rust and Cargo (edition 2021).
   - [Anchor CLI](https://project-serum.github.io/anchor/getting-started/installation.html) for building on-chain programs.
   - Solana CLI tools.
   - Node.js (if using TypeScript client integrations).

3. **Configure Environment Variables**

   Use a `.env` file (supported through the `dotenv` crate) to store and manage environment variables such as RPC URLs, keypair paths, and other configuration settings.

## Building and Running

### Off-Chain Client

The off-chain binary, for example, `merkle-root-uploader`, listens for specific events on-chain and triggers merkle root uploads. To build and run:
