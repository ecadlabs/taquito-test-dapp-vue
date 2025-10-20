# Sapling Private Transactions Test

This directory contains comprehensive tests for the Sapling protocol, which enables private transactions on Tezos using zero-knowledge proofs.

## Overview

Sapling is a privacy-preserving protocol introduced in the Edo protocol upgrade. It allows users to:

- **Shield**: Move tez from a public address to a private shielded pool
- **Transfer**: Send tez privately between shielded addresses (completely confidential)
- **Unshield**: Return tez from the private pool back to a public address

All Sapling transactions use zero-knowledge proofs to verify correctness without revealing transaction details.

## Files

### `sapling-single-state.ts`

Core test logic implementing the complete Sapling workflow:

1. Deploy a Sapling contract
2. Generate spending/viewing keys for two users (Alice and Bob)
3. Shield 3 tez to Alice's private address
4. Privately transfer 2 tez from Alice to Bob
5. Unshield 1 tez back to public address
6. Verify all balances and transaction histories

### `sapling-single-state.vue`

Vue component providing the user interface:

- Progress tracking for each operation
- Results display showing contract address and balances
- Loading states with warnings about proof generation time
- Copy-to-clipboard functionality for addresses

## Key Concepts

### Spending Key (sask)

- **Purpose**: Used to spend tokens and create proofs
- **Security**: Must be kept secret - never share
- **Format**: Base58 encoded, starts with `sask`
- **Usage**: Only needed when creating transactions

### Viewing Key

- **Purpose**: Derived from spending key, used to view transactions and balances
- **Security**: Can be safely shared to let others see your transaction history
- **Usage**: Generates payment addresses for receiving funds

### Payment Address (zet...)

- **Purpose**: Public Sapling address for receiving shielded funds
- **Format**: Starts with `zet`
- **Security**: Safe to share publicly
- **Note**: Different from regular tz1 addresses

### Memo

- **Purpose**: Optional message attached to transaction
- **Size**: Fixed (typically 8 bytes for test contracts)
- **Encoding**: UTF-8, may result in more than 1 byte per character

## Operation Flow

### Shield: Public → Private

```
User Account (tz1...)
    ↓ (3 ꜩ + gas fees)
Shielded Pool
    ↓
User's Sapling Address (zet...)
```

### Transfer: Private → Private

```
Alice's Sapling Address (zet...alice)
    ↓ (2 ꜩ, completely private)
Shielded Pool
    ↓
Bob's Sapling Address (zet...bob)
```

_Note: This transaction is completely invisible on the blockchain - neither amount nor recipient is revealed_

### Unshield: Private → Public

```
Alice's Sapling Address (zet...)
    ↓ (1 ꜩ)
Shielded Pool
    ↓
Recipient Account (tz1...)
```

## Performance Considerations

⚠️ **Proof Generation is CPU-Intensive**

- Each Sapling transaction requires generating a zero-knowledge proof
- This process typically takes **10-30 seconds** per operation
- Uses significant CPU and memory resources
- Performance varies based on hardware:
  - Modern computers: 10-15 seconds
  - Older/slower hardware: 20-30+ seconds
  - Mobile devices: May be very slow or encounter memory issues

**Best Practices:**

- Do not interrupt the process once started
- Use a computer with modern CPU for testing
- Be patient - the wait time is security verification
- Test on lower-end devices to identify performance issues

## Security Considerations

### ✅ Safe Practices

- Generate new spending keys for each test
- Use viewing keys to check balances instead of spending keys
- Share payment addresses (zet...) publicly
- Keep spending keys in secure storage

### ⚠️ Warning Signs

- Never share spending keys via network or chat
- Never log spending keys to console in production
- Never hardcode spending keys in code
- Verify contract addresses before sending funds

### Implementation Notes

This test implementation:

- Generates new keys from mnemonics for each run
- Does not store keys after test completion
- Uses in-memory key storage only
- Clears test data after results are displayed

## Browser Compatibility

| Browser | Sapling Support | Notes                   |
| ------- | --------------- | ----------------------- |
| Chrome  | ✅ Yes          | Recommended for testing |
| Firefox | ✅ Yes          | Full support            |
| Safari  | ⚠️ Limited      | May have WASM issues    |
| Edge    | ✅ Yes          | Works well              |

**Potential Issues:**

- Safari may struggle with WASM memory allocation
- Older browser versions lack proper BigInt support
- Some browsers may timeout during proof generation

## Network Support

Sapling requires protocol 015 (Edo) or later:

| Network        | Sapling | Notes                   |
| -------------- | ------- | ----------------------- |
| Ghostnet       | ✅ Yes  | Recommended for testing |
| Seoulnet       | ✅ Yes  | Available               |
| Shadownet      | ✅ Yes  | Available               |
| Mainnet        | ✅ Yes  | Live Sapling contracts  |
| Older testnets | ❌ No   | Use newer networks      |

## Testing Checklist

When implementing Sapling tests in a new dApp:

- [ ] Dependencies installed (`@taquito/sapling`, `bip39`)
- [ ] Contracts deploy successfully
- [ ] Key generation works for multiple users
- [ ] Payment addresses are valid (start with "zet")
- [ ] Shield operation succeeds and increases balance
- [ ] Transfer operation executes privately
- [ ] Unshield operation returns to public address
- [ ] Balance queries return correct amounts
- [ ] Transaction history shows all operations
- [ ] Error handling for insufficient balance
- [ ] UI shows clear loading states during proof generation
- [ ] Mobile responsive design
- [ ] Works on Ghostnet, Seoulnet, and Shadownet
- [ ] Performance acceptable on lower-end devices
- [ ] Security warnings are prominent

## Troubleshooting

### "Proof generation timed out"

- **Cause**: CPU too slow or memory constraints
- **Solution**: Run on faster hardware or reduce proof complexity

### "WASM module failed to load"

- **Cause**: Browser WASM support issue
- **Solution**: Try different browser, update browser, clear cache

### "Insufficient balance"

- **Cause**: Not enough tez in account for gas fees
- **Solution**: Use faucet to fund account, wait for previous operation confirmation

### "Contract deployment failed"

- **Cause**: Network issues or contract syntax error
- **Solution**: Check network connection, verify contract code

### "Invalid spending key"

- **Cause**: Key generation failed or corrupted
- **Solution**: Generate new key, check mnemonic format

## References

### Taquito Sapling Package

- **NPM**: https://www.npmjs.com/package/@taquito/sapling
- **Documentation**: https://taquito.io/docs/sapling
- **Spending Key**: https://taquito.io/docs/sapling_in_memory_spending_key
- **Viewing Key**: https://taquito.io/docs/sapling_in_memory_viewing_key

### Tezos Sapling Protocol

- **Official Docs**: https://tezos.gitlab.io/active/sapling.html
- **TZIP Proposal**: https://gitlab.com/tezos/tzip/-/blob/master/drafts/current/draft_sapling.md
- **Protocol Upgrade**: https://tezos.gitlab.io/protocols/015_mumbai.html

### Use Cases

- **Confidential Payments**: Hide transaction amounts
- **Private Payroll**: Distribute salaries privately
- **Privacy-Preserving DeFi**: Swap tokens without revealing amounts
- **Confidential Voting**: Secret ballot systems
- **Anonymous Donations**: Contribute without public attribution

## Implementation Notes for Developers

### Adding New Sapling Tests

To extend this implementation with additional test types:

1. **Multiple States** (`sapling-multiple-states.ts`):
   - Create contract with multiple independent Sapling pools
   - Test updating specific pools
   - Verify pool isolation

2. **Batched Operations** (`sapling-batched.ts`):
   - Combine multiple shield operations in one transaction
   - Batch transfers between multiple recipients
   - Verify all operations succeed atomically

3. **Proving Key Mode** (`sapling-proving-key.ts`):
   - Use proving key instead of spending key for proofs
   - Demonstrates hardware wallet scenario
   - Separates proof generation from key management

### API Reference

```typescript
// Generate keys from mnemonic
const spendingKey = await InMemorySpendingKey.fromMnemonic(mnemonic);

// Get viewing key
const viewingKey = await spendingKey.getSaplingViewingKeyProvider();

// Get payment address
const { address } = await viewingKey.getAddress();

// Create Sapling toolkit
const toolkit = new SaplingToolkit(
  { saplingSigner: spendingKey },
  { contractAddress, memoSize: 8 },
  tezos.rpc,
);

// Prepare shield transaction
const shieldTx = await toolkit.prepareShieldedTransaction([
  {
    to: paymentAddress,
    amount: 3,
    memo: "Shield test",
  },
]);

// Prepare Sapling transaction (private transfer)
const saplingTx = await toolkit.prepareSaplingTransaction([
  {
    to: bobAddress,
    amount: 2,
    memo: "Gift",
  },
]);

// Prepare unshield transaction
const unshieldTx = await toolkit.prepareUnshieldedTransaction({
  to: recipientAddress,
  amount: 1,
});

// Get balances
const viewer = await toolkit.getSaplingTransactionViewer();
const balance = await viewer.getBalance();
```

## Future Enhancements

- [ ] Add Sapling address book for common recipients
- [ ] Implement transaction history viewer with spent/unspent status
- [ ] Add multi-recipient batch operations
- [ ] Create Sapling state inspection tool
- [ ] Add support for custom memo sizes
- [ ] Implement Sapling address validator utility
- [ ] Add QR code generation for payment addresses
- [ ] Create visualization of fund flow (shield → transfer → unshield)

## Contributing

When adding new Sapling tests:

1. Follow the existing code structure
2. Add comprehensive error handling
3. Include progress callbacks for long operations
4. Document security considerations
5. Add visual diagrams for user understanding
6. Test on multiple browsers and networks
7. Include performance notes
8. Update this README

## License

Same as the parent test dApp project.
