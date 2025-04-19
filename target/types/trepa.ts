/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/trepa.json`.
 */
export type Trepa = {
  "address": "8PYDEgUSwdpbvWUtER6mAeCveCFFCTR123RoZ6YrvdKA",
  "metadata": {
    "name": "trepa",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "claimRewards",
      "docs": [
        "Claim the rewards for a prediction"
      ],
      "discriminator": [
        4,
        144,
        132,
        71,
        116,
        23,
        151,
        80
      ],
      "accounts": [
        {
          "name": "predictor",
          "writable": true,
          "signer": true
        },
        {
          "name": "prediction",
          "writable": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "predictorTokenAccount",
          "writable": true
        },
        {
          "name": "poolTokenAccount",
          "writable": true
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
    },
    {
      "name": "createPool",
      "docs": [
        "Creates a new prediction pool"
      ],
      "discriminator": [
        233,
        146,
        209,
        142,
        207,
        104,
        64,
        188
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "clock",
          "address": "SysvarC1ock11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "questionId",
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
      "name": "initialize",
      "docs": [
        "Initializes the Trepa platform with configurable parameters"
      ],
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
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
        },
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    },
    {
      "name": "predict",
      "docs": [
        "Predicts the outcome of a pool"
      ],
      "discriminator": [
        254,
        114,
        112,
        244,
        37,
        49,
        32,
        128
      ],
      "accounts": [
        {
          "name": "predictor",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "prediction",
          "writable": true
        },
        {
          "name": "predictorTokenAccount",
          "writable": true
        },
        {
          "name": "poolTokenAccount",
          "writable": true
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "predictionId",
          "type": {
            "array": [
              "u8",
              16
            ]
          }
        },
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
      "name": "resolvePool",
      "docs": [
        "Start a pool resolution"
      ],
      "discriminator": [
        191,
        164,
        190,
        142,
        178,
        198,
        162,
        249
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "pool",
          "writable": true
        },
        {
          "name": "poolTokenAccount",
          "writable": true
        },
        {
          "name": "treasuryTokenAccount",
          "writable": true
        },
        {
          "name": "config"
        },
        {
          "name": "wsolMint"
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
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
      "name": "updateConfig",
      "docs": [
        "Updates the platform parameters"
      ],
      "discriminator": [
        29,
        158,
        252,
        191,
        10,
        83,
        219,
        99
      ],
      "accounts": [
        {
          "name": "admin",
          "writable": true,
          "signer": true
        },
        {
          "name": "config",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  110,
                  102,
                  105,
                  103
                ]
              }
            ]
          }
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
        },
        {
          "name": "treasury",
          "type": "pubkey"
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "configAccount",
      "discriminator": [
        189,
        255,
        97,
        70,
        186,
        189,
        24,
        102
      ]
    },
    {
      "name": "poolAccount",
      "discriminator": [
        116,
        210,
        187,
        119,
        196,
        196,
        52,
        137
      ]
    },
    {
      "name": "predictionAccount",
      "discriminator": [
        243,
        151,
        200,
        125,
        130,
        3,
        41,
        117
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "unauthorized",
      "msg": "Unauthorized admin action"
    },
    {
      "code": 6001,
      "name": "poolAlreadyFinalized",
      "msg": "Pool already finalized"
    },
    {
      "code": 6002,
      "name": "invalidPool",
      "msg": "Invalid pool passed"
    },
    {
      "code": 6003,
      "name": "invalidEndTime",
      "msg": "Invalid pool end time"
    },
    {
      "code": 6004,
      "name": "rewardsAlreadyClaimed",
      "msg": "Rewards already claimed"
    },
    {
      "code": 6005,
      "name": "unauthorizedClaim",
      "msg": "Unauthorized claim"
    },
    {
      "code": 6006,
      "name": "invalidMint",
      "msg": "Invalid mint account"
    },
    {
      "code": 6007,
      "name": "invalidTokenAccountOwner",
      "msg": "Invalid pool token account owner"
    },
    {
      "code": 6008,
      "name": "poolNotFinalized",
      "msg": "Pool not finalized"
    },
    {
      "code": 6009,
      "name": "poolNotResolved",
      "msg": "Pool not resolved"
    }
  ],
  "types": [
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "admin",
            "type": "pubkey"
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
            "type": "pubkey"
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
            "name": "questionId",
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
            "name": "predictionId",
            "type": {
              "array": [
                "u8",
                16
              ]
            }
          },
          {
            "name": "predictor",
            "type": "pubkey"
          },
          {
            "name": "pool",
            "type": "pubkey"
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
  ]
};
