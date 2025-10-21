# Sapling Shield Operation Demo

This test demonstrates Taquito's Sapling shield operation: moving tez from public to private addresses using zero-knowledge proofs.

## What This Demonstrates

✅ **Key Generation** - Creating Sapling spending and viewing keys using `@taquito/sapling`  
✅ **Payment Addresses** - Deriving shielded payment addresses (zet...)  
✅ **Zero-Knowledge Proofs** - Real proof generation (CPU-intensive, observable 10-30s delay)  
✅ **Transaction Preparation** - Creating shielded transactions with cryptographic proofs  
✅ **On-Chain Submission** - Sending Sapling transactions to Ghostnet  
✅ **Contract Deployment** - Originating contracts that accept sapling_transaction parameters  
✅ **No Simulation** - All operations use real cryptography and blockchain

## Complete Shield Workflow

1. **Deploy Contract** - Minimal Michelson contract that accepts Sapling transactions
2. **Generate Keys** - Create Alice's Sapling spending and viewing keys
3. **Create Proof** - Generate zero-knowledge proof (10-30 seconds of CPU-intensive computation)
4. **Prepare Transaction** - Build shielded transaction with proof
5. **Submit On-Chain** - Send to contract and wait for confirmation

## Why Shield Only?

This demo focuses on the shield operation to provide a clean, working demonstration of Taquito's Sapling capabilities. Full protocol implementation (including transfer and unshield with state tracking) would require complex Michelson contract development, which is outside the scope of demonstrating Taquito's client-side features.

## Documentation

- [Taquito Sapling Docs](https://taquito.io/docs/sapling)
- [Tezos Sapling Protocol](https://tezos.gitlab.io/active/sapling.html)
