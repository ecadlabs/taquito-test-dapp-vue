export interface ContractConfig {
  address: string;
  originatedAt: string;
  network: string;
  contractName?: string;
}

export type CounterStorage = number; // just a number
export type DelegationStorage = string; // address
export type StakingStorage = number; // amount
export type TransferStorage = number; // balance

// Complex parameters contract storage
export interface ComplexParametersStorage {
  user_records: any;
  metadata_map: any;
  complex_data: any;
  authorized_users: any;
  last_updated: string;
}

export type ContractStorage =
  | CounterStorage
  | DelegationStorage
  | StakingStorage
  | TransferStorage
  | ComplexParametersStorage
  | number;
