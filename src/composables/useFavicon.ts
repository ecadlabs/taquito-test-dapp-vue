import { useWalletStore } from "@/stores/walletStore";
import { watch } from "vue";

export const useFavicon = () => {
  const walletStore = useWalletStore();

  const updateFavicon = (isConnected: boolean) => {
    const link = document.querySelector(
      "link[rel='icon']",
    ) as HTMLLinkElement | null;

    if (link) {
      link.href = isConnected ? "/favicon-connected.svg" : "/favicon.svg";
    }
  };

  // Watch for wallet address changes
  watch(
    () => walletStore.getAddress,
    (newAddress) => {
      updateFavicon(!!newAddress);
    },
    { immediate: true },
  );

  return {
    updateFavicon,
  };
};
