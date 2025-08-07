import type { IndexerOption } from '@/stores/settingsStore';
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const buildIndexerUrl = (indexer: IndexerOption, networkType: string) => {
  return indexer.url.replace('[networkType]', networkType);
}