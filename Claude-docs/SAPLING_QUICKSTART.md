# Sapling Test - Quick Start Guide

🔒 **Private Transactions on Tezos using Zero-Knowledge Proofs**

## What You'll Learn

This test demonstrates the complete Sapling workflow:

```
Your Account (tz1)
    ↓
    🛡️ SHIELD (make private)
    ↓
Your Private Address (zet)
    ├─ 🔄 TRANSFER (to Bob - completely private!)
    │  └─ Bob's Private Address (zet)
    │
    └─ 🔓 UNSHIELD (return to public)
       ↓
    Recipient Account (tz1)
```

## Quick Start (5 Minutes)

### 1️⃣ Setup

- ✅ Wallet connected (Temple, Kukai, or similar)
- ✅ ~5 Tez in wallet (for gas fees)
- ✅ Using Ghostnet, Seoulnet, or Shadownet network
- ⏱️ Have 1-2 minutes free (proof generation takes time)

### 2️⃣ Run the Test

1. Open the test dApp
2. Click on **Cryptography & Security** category
3. Select **Sapling: Private Transactions**
4. Click **Run Sapling Test**
5. Wait for operations to complete (40-95 seconds total)

### 3️⃣ What Happens

- **Deploy Contract** (5-10 sec) ← Alice and Bob get new addresses
- **Shield** (15-30 sec) ← Move 3 ℸ to private pool 🛡️
- **Transfer** (15-30 sec) ← Alice sends Bob 2 ℸ privately 🔄
- **Unshield** (15-30 sec) ← Alice returns 1 ℸ to public 🔓

### 4️⃣ View Results

You'll see:

- ✅ Contract address (KT1...)
- ✅ Alice's private address (zet...)
- ✅ Bob's private address (zet...)
- ✅ Transaction hashes and balances
- ✅ How much time each operation took

## Why This Matters

### Privacy

Your Sapling transactions are **completely confidential**:

- 🔒 Amount hidden
- 🔒 Recipient hidden
- 🔒 Sender hidden
- ✅ Verified by cryptography (not trust)

### Use Cases

- **Confidential Payments** - Hide payment amounts
- **Private Payroll** - Distribute salaries secretly
- **Anonymous Donations** - Contribute without revealing identity
- **Privacy-Preserving DeFi** - Trade without showing balances

## Common Questions

### ⏱️ Why does it take so long?

Proof generation is CPU-intensive cryptography that:

- Proves you own the funds ✓
- Verifies you have sufficient balance ✓
- Confirms valid transaction structure ✓
- All without revealing any sensitive data ✓

This is **normal and secure** - don't interrupt it!

### 💾 Where's my spending key stored?

**Nowhere!** This test:

- ✅ Generates new keys fresh each time
- ✅ Uses in-memory storage only
- ✅ Clears all data after test completes
- ✅ Never saves or logs private information

### 🌐 What's a "zet" address?

- **tz1...** = Regular Tezos address (public)
- **zet...** = Sapling address (private)
- They're part of the same ecosystem but serve different purposes

### 💰 How much does it cost?

Like any transaction:

- Gas fees apply (usually 0.1-0.5 ℸ)
- Proof generation is free (happens in browser)
- Public → Private costs similar to regular transfer
- Private transfers may cost slightly more

## Troubleshooting

| Problem                            | Solution                                     |
| ---------------------------------- | -------------------------------------------- |
| "Proof generation taking too long" | This is normal! Wait 20-30 sec per operation |
| "WASM module failed"               | Clear cache, try Chrome/Firefox, reload      |
| "Insufficient balance"             | Use faucet to fund wallet with testnet Tez   |
| "Browser feels frozen"             | Normal - CPU is busy generating proofs       |

## Next Steps

### Learn More

- 📖 Full documentation: See `src/modules/tests/tests/sapling/README.md`
- 🔗 Taquito docs: https://taquito.io/docs/sapling
- 🔗 Tezos protocol: https://tezos.gitlab.io/active/sapling.html

### Try Other Tests

- ✅ **Transfer Tez** - Basic transactions
- ✅ **Sign Payload** - Cryptographic signatures
- ✅ **Counter Contract** - Smart contract interactions

### Advanced (Future)

- Multiple Sapling pools in one contract
- Batched private operations
- Hardware wallet integration

## Network Info

| Network   | Status   | Recommended     |
| --------- | -------- | --------------- |
| Ghostnet  | ✅ Works | **Best choice** |
| Seoulnet  | ✅ Works | Good            |
| Shadownet | ✅ Works | Good            |
| Mainnet   | ✅ Works | For real funds  |

## Security Reminders

✅ **Safe:**

- Sharing your zet... address (like a payment address)
- Using viewing key to check balances
- Generating new keys for each test
- Testing on testnets

❌ **Never:**

- Share spending keys (sask...)
- Log private keys
- Give keys to untrusted apps
- Store keys unencrypted

## Fun Facts 🎓

- Sapling uses **zero-knowledge proofs** - prove something without revealing what
- Developed by **Electric Coin Company** (same team behind Zcash)
- Integrated into **Tezos Edo protocol** (March 2021)
- Transactions are **completely private** - blockchain can't analyze them
- Uses **~50MB of parameters** (auto-downloaded, cached locally)

## Ready?

1. Connect your wallet ✓
2. Navigate to Cryptography & Security ✓
3. Click "Sapling: Private Transactions" ✓
4. Click "Run Sapling Test" ✓
5. Watch the magic happen! ✨

---

**Questions?** Check the full README or Taquito documentation.

**Having issues?** See troubleshooting section above or check browser console for errors.

**Happy testing!** 🚀
