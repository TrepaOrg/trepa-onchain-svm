export type Trepa = {
  "version": "0.1.0",
  "name": "trepa",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initializes the Trepa platform with configurable parameters"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minStake",
          "type": "u64"
        },
        {
          "name": "maxStake",
          "type": "u64"
        },
        {
          "name": "maxRoi",
          "type": "u64"
        },
        {
          "name": "platformFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Updates the platform parameters"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minStake",
          "type": "u64"
        },
        {
          "name": "maxStake",
          "type": "u64"
        },
        {
          "name": "maxRoi",
          "type": "u64"
        },
        {
          "name": "platformFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createPool",
      "docs": [
        "Creates a new prediction pool"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "question",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "predictionEndTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "resolvePool",
      "docs": [
        "Start a pool resolution"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "merkleRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "protocolFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "predict",
      "docs": [
        "Predicts the outcome of a pool"
      ],
      "accounts": [
        {
          "name": "predictor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "predictorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pred",
          "type": "u8"
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimRewards",
      "docs": [
        "Claim the rewards for a prediction"
      ],
      "accounts": [
        {
          "name": "predictor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "prediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "predictorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "minStake",
            "type": "u64"
          },
          {
            "name": "maxStake",
            "type": "u64"
          },
          {
            "name": "maxRoi",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "poolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "question",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "predictionEndTime",
            "type": "i64"
          },
          {
            "name": "totalStake",
            "type": "u64"
          },
          {
            "name": "isResolved",
            "type": "bool"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "predictionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "prediction",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "predictor",
            "type": "publicKey"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "predictionValue",
            "type": "u8"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CustomError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PredictionNotEnded"
          },
          {
            "name": "InsufficientFunds"
          },
          {
            "name": "PoolAlreadyBeingResolved"
          },
          {
            "name": "InvalidProof"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized admin action"
    },
    {
      "code": 6001,
      "name": "PoolAlreadyFinalized",
      "msg": "Pool already finalized"
    },
    {
      "code": 6002,
      "name": "InvalidPool",
      "msg": "Invalid pool passed"
    },
    {
      "code": 6003,
      "name": "InvalidEndTime",
      "msg": "Invalid pool end time"
    },
    {
      "code": 6004,
      "name": "RewardsAlreadyClaimed",
      "msg": "Rewards already claimed"
    },
    {
      "code": 6005,
      "name": "UnauthorizedClaim",
      "msg": "Unauthorized claim"
    },
    {
      "code": 6006,
      "name": "InvalidMint",
      "msg": "Invalid mint account"
    },
    {
      "code": 6007,
      "name": "InvalidTokenAccountOwner",
      "msg": "Invalid pool token account owner"
    },
    {
      "code": 6008,
      "name": "PoolNotFinalized",
      "msg": "Pool not finalized"
    },
    {
      "code": 6009,
      "name": "PoolNotResolved",
      "msg": "Pool not resolved"
    }
  ]
};

export const IDL: Trepa = {
  "version": "0.1.0",
  "name": "trepa",
  "instructions": [
    {
      "name": "initialize",
      "docs": [
        "Initializes the Trepa platform with configurable parameters"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasury",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minStake",
          "type": "u64"
        },
        {
          "name": "maxStake",
          "type": "u64"
        },
        {
          "name": "maxRoi",
          "type": "u64"
        },
        {
          "name": "platformFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "updateConfig",
      "docs": [
        "Updates the platform parameters"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "config",
          "isMut": true,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "minStake",
          "type": "u64"
        },
        {
          "name": "maxStake",
          "type": "u64"
        },
        {
          "name": "maxRoi",
          "type": "u64"
        },
        {
          "name": "platformFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "createPool",
      "docs": [
        "Creates a new prediction pool"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "clock",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "question",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
        {
          "name": "predictionEndTime",
          "type": "i64"
        }
      ]
    },
    {
      "name": "resolvePool",
      "docs": [
        "Start a pool resolution"
      ],
      "accounts": [
        {
          "name": "admin",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "treasuryTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "config",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "merkleRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "protocolFee",
          "type": "u64"
        }
      ]
    },
    {
      "name": "predict",
      "docs": [
        "Predicts the outcome of a pool"
      ],
      "accounts": [
        {
          "name": "predictor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "prediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "predictorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "pred",
          "type": "u8"
        },
        {
          "name": "stake",
          "type": "u64"
        }
      ]
    },
    {
      "name": "claimRewards",
      "docs": [
        "Claim the rewards for a prediction"
      ],
      "accounts": [
        {
          "name": "predictor",
          "isMut": true,
          "isSigner": true
        },
        {
          "name": "prediction",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "pool",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "predictorTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "poolTokenAccount",
          "isMut": true,
          "isSigner": false
        },
        {
          "name": "wsolMint",
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "tokenProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": [
        {
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "proof",
          "type": {
            "vec": {
              "array": [
                "u8",
                32
              ]
            }
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "publicKey"
          },
          {
            "name": "minStake",
            "type": "u64"
          },
          {
            "name": "maxStake",
            "type": "u64"
          },
          {
            "name": "maxRoi",
            "type": "u64"
          },
          {
            "name": "platformFee",
            "type": "u64"
          },
          {
            "name": "treasury",
            "type": "publicKey"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "poolAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "question",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "predictionEndTime",
            "type": "i64"
          },
          {
            "name": "totalStake",
            "type": "u64"
          },
          {
            "name": "isResolved",
            "type": "bool"
          },
          {
            "name": "isFinalized",
            "type": "bool"
          },
          {
            "name": "root",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "predictionAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "prediction",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "predictor",
            "type": "publicKey"
          },
          {
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "predictionValue",
            "type": "u8"
          },
          {
            "name": "isClaimed",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ],
  "types": [
    {
      "name": "CustomError",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "PredictionNotEnded"
          },
          {
            "name": "InsufficientFunds"
          },
          {
            "name": "PoolAlreadyBeingResolved"
          },
          {
            "name": "InvalidProof"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized admin action"
    },
    {
      "code": 6001,
      "name": "PoolAlreadyFinalized",
      "msg": "Pool already finalized"
    },
    {
      "code": 6002,
      "name": "InvalidPool",
      "msg": "Invalid pool passed"
    },
    {
      "code": 6003,
      "name": "InvalidEndTime",
      "msg": "Invalid pool end time"
    },
    {
      "code": 6004,
      "name": "RewardsAlreadyClaimed",
      "msg": "Rewards already claimed"
    },
    {
      "code": 6005,
      "name": "UnauthorizedClaim",
      "msg": "Unauthorized claim"
    },
    {
      "code": 6006,
      "name": "InvalidMint",
      "msg": "Invalid mint account"
    },
    {
      "code": 6007,
      "name": "InvalidTokenAccountOwner",
      "msg": "Invalid pool token account owner"
    },
    {
      "code": 6008,
      "name": "PoolNotFinalized",
      "msg": "Pool not finalized"
    },
    {
      "code": 6009,
      "name": "PoolNotResolved",
      "msg": "Pool not resolved"
    }
  ]
};
