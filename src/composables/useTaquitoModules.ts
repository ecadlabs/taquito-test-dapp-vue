/**
 * Composable for loading Taquito modules dynamically to reduce initial bundle size
 */
export const useTaquitoModules = () => {
  const loadUtils = async () => {
    const module = await import("@taquito/utils");
    return {
      stringToBytes: module.stringToBytes,
      verifySignature: module.verifySignature,
      num2PaddedHex: module.num2PaddedHex,
    };
  };

  const loadBeaconTypes = async () => {
    const module = await import("@airgap/beacon-types");
    return {
      SigningType: module.SigningType,
    };
  };

  const loadMichelCodec = async () => {
    const module = await import("@taquito/michel-codec");
    return {
      Parser: module.Parser,
      packDataBytes: module.packDataBytes,
    };
  };

  const loadLucideIcon = async (iconName: string) => {
    const { loadIcon } = await import("@/lib/icons");
    return loadIcon(iconName);
  };

  return {
    loadUtils,
    loadBeaconTypes,
    loadMichelCodec,
    loadLucideIcon,
  };
};
