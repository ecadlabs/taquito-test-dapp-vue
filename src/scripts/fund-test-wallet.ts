import getTez from "@tacoinfra/get-tez";
import { TezosToolkit } from "@taquito/taquito";
import { config } from "dotenv";

config();

const getAccountBalance = async (address: string): Promise<number> => {
  const rpcUrl = process.env.VITE_RPC_URL;

  if (!address || !address.startsWith("tz")) {
    throw new Error(
      `Received invalid address: ${address}. Address must start with "tz"`,
    );
  }

  if (!rpcUrl) {
    throw new Error("RPC URL is required. Received " + rpcUrl);
  }

  const Tezos = new TezosToolkit(rpcUrl);

  try {
    const balance = await Tezos.tz.getBalance(address);

    return balance.toNumber() / 1000000;
  } catch (error) {
    throw new Error(`Failed to get balance for ${address}: ${error}`);
  }
};

const fundAccount = async (address: string, amount: number) => {
  const network =
    process.env.VITE_NETWORK_NAME || process.env.VITE_NETWORK_TYPE;

  if (!network) {
    throw new Error(`Received invalid network: ${network}`);
  }

  const transactionHash = await getTez({
    address,
    amount,
    network,
  });

  return transactionHash;
};

if (import.meta.url === `file://${process.argv[1]}`) {
  const address = process.argv[2];
  let balance = 0;
  try {
    console.log(`🔍 Checking if we need to fund wallet ${address}...`);
    balance = await getAccountBalance(address);
    console.log(`📋 Test wallet balance: ${balance} ꜩ`);
  } catch (error) {
    console.error(`\n💥 Failed to get wallet balance:`, error);
    process.exit(1);
  }

  if (balance < 10) {
    try {
      console.log(`💸 Balance is less than 10 ꜩ, topping up to 10 ꜩ...`);
      await fundAccount(address, 10 - balance);
      console.log(`📋 New wallet balance: ${balance + (10 - balance)} ꜩ`);
    } catch (error) {
      console.error(`\n💥 Failed to fund wallet:`, error);
      process.exit(1);
    }
  } else {
    console.log(`✅ Balance is higher than 10 ꜩ, no action required.`);
  }
}
