# Migration map

This distribution is a new repository, not an in-place upgrade of the previous treasury backend.

| Previous subsystem                       | Nimiq replacement                                        |
| ---------------------------------------- | -------------------------------------------------------- |
| Arc Testnet and USDC unit configuration  | Nimiq host network and integer Luna                      |
| Solidity QuorailVault                    | Direct wallet-approved basic NIM transaction             |
| Server-side agent signing                | Native Nimiq Pay confirmation                            |
| Claude execution requirement             | Deterministic local consequence calculation              |
| Single-vault owner authentication        | Local planning workspace scoped to a shared address      |
| PostgreSQL obligations and audit records | Validated local plans with JSON backup                   |
| Arcscan receipts                         | Network-specific Nimiq RPC checks and explorer links     |
| Browser EVM provider discovery           | Nimiq Mini App SDK initialization                        |
| Circle bridge, faucet and vault scripts  | No equivalent required for direct NIM payments           |
| Large desktop treasury console           | Responsive payment planning, payment review and activity |
| Earlier branding and deployment docs     | Rewritten Quorail-Nimiq identity and operating guide     |

The source ZIP contains no inherited server API routes, Solidity contracts, signer keys, chain-specific deployment scripts or old backup folders. The original MIT notice is retained.

Important product differences:

- There is no autonomous spending or reserve custody.
- Plans are device-local and unencrypted, not server-authenticated records.
- There is no team sharing, multi-device sync or database persistence.
- NIM is the only implemented asset.
- A payment request is distinct from successful inclusion.
- Native wallet sender selection remains controlled by Nimiq Pay.

The original Quorail project remains separate and unchanged.
