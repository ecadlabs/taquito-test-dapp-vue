import { InMemorySigner } from "@taquito/signer";
import { TezosToolkit } from "@taquito/taquito";
import { config } from "dotenv";

config();

const rpc = process.env.VITE_RPC_URL;

/**
 * Reveals the public key associated with a given private key on the Tezos
 * blockchain.
 *
 * This script connects to the Tezos node specified by the `VITE_RPC_URL`
 * environment variable, sets up an in-memory signer using the provided private
 * key, and runs a reveal operation.
 *
 * Usage: `npm run reveal-key <private_key>`
 *
 * Notes:
 *
 * - The reveal operation is required for accounts whose public key has not yet
 *   been revealed on-chain.
 * - If the public key is already revealed, this function will fail.
 * - This script is designed to be run from the command line in a local
 *   development environment.
 */
const reveal = async (key: string) => {
  if (!rpc) {
    console.error("❌ No RPC URL provided. Received: ", rpc);
    process.exit(1);
  }

  const Tezos = new TezosToolkit(rpc);
  console.log("✍️ Setting a signer using the in memory signer...");

  try {
    Tezos.setProvider({ signer: await InMemorySigner.fromSecretKey(key) });
  } catch (error) {
    console.error(
      "❌ Error setting signer (this usually means the private key is invalid):",
      error,
    );
    process.exit(1);
  }

  try {
    const op = await Tezos.contract.reveal({});
    console.log(`🔗 Operation injected: ${op.hash}`);
    await op.confirmation();
    console.log("✅ Public key successfully revealed!");
  } catch (err) {
    console.error("❌ Error revealing public key:", err);
    process.exit(1);
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const key = process.argv[2];
  console.log(
    `\n🔐 Attempting to reveal public key for private key '${key.slice(0, 15)}...${key.slice(-5)}'`,
  );

  if (!key) {
    console.error("❌ No private key supplied");
    process.exit(1);
  } else {
    reveal(key);
  }
}
