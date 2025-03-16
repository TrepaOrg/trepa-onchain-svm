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
          "name": "authority",
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
      "name": "updateParameters",
      "docs": [
        "Updates the platform parameters"
      ],
      "accounts": [
        {
          "name": "authority",
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
          "name": "systemProgram",
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
      "name": "resolvePool",
      "docs": [
        "Finalizes a pool"
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
        }
      ],
      "args": [
        {
          "name": "prizeAmounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "claimRewards",
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
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
            "name": "isFinalized",
            "type": "bool"
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
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "predictionValue",
            "type": "u8"
          },
          {
            "name": "prize",
            "type": "u64"
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
            "name": "ConfigAlreadyExists"
          },
          {
            "name": "QuestionTooLong"
          },
          {
            "name": "PredictionNotEnded"
          },
          {
            "name": "PoolAlreadyFinalized"
          },
          {
            "name": "InvalidPool"
          },
          {
            "name": "MismatchedPrizeCount"
          },
          {
            "name": "PredictionAlreadyClaimed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized update"
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
          "name": "authority",
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
      "name": "updateParameters",
      "docs": [
        "Updates the platform parameters"
      ],
      "accounts": [
        {
          "name": "authority",
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
          "name": "systemProgram",
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
      "name": "resolvePool",
      "docs": [
        "Finalizes a pool"
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
        }
      ],
      "args": [
        {
          "name": "prizeAmounts",
          "type": {
            "vec": "u64"
          }
        }
      ]
    },
    {
      "name": "claimRewards",
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
          "isMut": false,
          "isSigner": false
        },
        {
          "name": "systemProgram",
          "isMut": false,
          "isSigner": false
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "configAccount",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
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
            "name": "isFinalized",
            "type": "bool"
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
            "name": "pool",
            "type": "publicKey"
          },
          {
            "name": "predictionValue",
            "type": "u8"
          },
          {
            "name": "prize",
            "type": "u64"
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
            "name": "ConfigAlreadyExists"
          },
          {
            "name": "QuestionTooLong"
          },
          {
            "name": "PredictionNotEnded"
          },
          {
            "name": "PoolAlreadyFinalized"
          },
          {
            "name": "InvalidPool"
          },
          {
            "name": "MismatchedPrizeCount"
          },
          {
            "name": "PredictionAlreadyClaimed"
          }
        ]
      }
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "Unauthorized",
      "msg": "Unauthorized update"
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
    }
  ]
};
