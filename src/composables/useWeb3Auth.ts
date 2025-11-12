// Re-export Web3Auth composables for use in components
export {
  useWeb3Auth,
  useWeb3AuthConnect,
  useWeb3AuthDisconnect,
} from "@web3auth/modal/vue";
import type { IProvider } from "@web3auth/base";

export type SocialLoginProvider = "google" | "discord" | "email_passwordless";

/** Get the private key from Web3Auth provider */
export const getPrivateKey = async (provider: IProvider): Promise<string> => {
  if (!provider) {
    throw new Error("No provider available. Connect first.");
  }

  const privateKey = await provider.request({
    method: "private_key",
  });

  if (typeof privateKey !== "string") {
    throw new Error("Failed to retrieve private key from Web3Auth");
  }

  return privateKey;
};
