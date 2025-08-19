export interface ContractConfig {
  address: string;
  originatedAt: string;
  network: string;
  contractName?: string;
}

export type CounterStorage = number;
export type DelegationStorage = string; // address
export type StakingStorage = number; // amount
export type TransferStorage = number; // balance

export type ContractStorage =
  | CounterStorage
  | DelegationStorage
  | StakingStorage
  | TransferStorage
  | number;
