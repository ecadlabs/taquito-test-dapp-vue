import type { BeaconWallet } from "@taquito/beacon-wallet";

export interface WalletDisplay {
  name?: string;
  /** Only set when the icon is safe to put in an `<img src>`. */
  iconUrl?: string;
}

const BASE64_IMAGE_DATA_URI =
  /^data:image\/(?:png|jpeg|gif|webp|svg\+xml);base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Accepts `https:` URLs and base64 `data:image/{png,jpeg,gif,webp,svg+xml}`
 * URIs (the form the Beacon wallet registry ships). Registry wallets ship data
 * URIs; other wallets supply their own icon URL through app metadata, which is
 * untrusted.
 */
export const toSafeIconUrl = (icon: string | undefined): string | undefined => {
  if (!icon) return undefined;
  if (BASE64_IMAGE_DATA_URI.test(icon)) return icon;
  if (!URL.canParse(icon)) return undefined;
  return new URL(icon).protocol === "https:" ? icon : undefined;
};

export const resolveBeaconWalletDisplay = async (
  source: Pick<BeaconWallet, "getWalletInfo">,
): Promise<WalletDisplay> => {
  const info = await source.getWalletInfo();
  const name = info?.name.trim();
  if (!info || !name) return {};

  const iconUrl = toSafeIconUrl(info.icon);
  return iconUrl ? { name, iconUrl } : { name };
};
