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

export interface UserRecord {
  name: string;
  age: number;
  active: boolean;
}

export interface NestedRecord {
  metadata: {
    created_at: string;
    updated_at: string | null;
    tags: string[];
  };
  permissions: string[];
}

// Complex parameters contract storage
export interface ComplexParametersStorage {
  user_records: Record<string, UserRecord>;
  metadata_map: Record<string, string>;
  complex_data: Record<string, NestedRecord>;
  authorized_users: Set<string>;
  last_updated: string;
}

export type ContractStorage =
  | CounterStorage
  | DelegationStorage
  | StakingStorage
  | TransferStorage
  | ComplexParametersStorage
  | number;
