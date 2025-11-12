import type { IProvider } from "@web3auth/base";
import { WEB3AUTH_NETWORK } from "@web3auth/base";
import { Web3Auth } from "@web3auth/modal";

class Web3AuthService {
  private web3auth: Web3Auth | null = null;
  private provider: IProvider | null = null;

  async initialize(): Promise<void> {
    if (this.web3auth) return; // Already initialized

    const clientId = import.meta.env.VITE_WEB3AUTH_CLIENT_ID;
    if (!clientId) {
      throw new Error(
        "VITE_WEB3AUTH_CLIENT_ID environment variable is required for Web3Auth",
      );
    }

    this.web3auth = new Web3Auth({
      clientId,
      web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
    });

    await this.web3auth.init();
  }

  async connect(): Promise<IProvider> {
    if (!this.web3auth) {
      await this.initialize();
    }

    if (!this.web3auth) {
      throw new Error("Web3Auth initialization failed");
    }

    this.provider = await this.web3auth.connect();

    if (!this.provider) {
      throw new Error("No provider returned from Web3Auth");
    }

    return this.provider;
  }

  async disconnect(): Promise<void> {
    if (!this.web3auth) return;

    await this.web3auth.logout();
    this.provider = null;
  }

  async getUserInfo(): Promise<{ name?: string; email?: string } | null> {
    if (!this.web3auth) {
      throw new Error("Web3Auth not initialized");
    }

    if (!this.web3auth.connected) {
      return null;
    }

    return await this.web3auth.getUserInfo();
  }

  isConnected(): boolean {
    return this.web3auth?.connected ?? false;
  }

  getProvider(): IProvider | null {
    return this.provider;
  }

  getInstance(): Web3Auth | null {
    return this.web3auth;
  }
}

export const web3AuthService = new Web3AuthService();
