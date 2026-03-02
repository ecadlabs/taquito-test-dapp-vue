import { computed, ref } from "vue";

interface Baker {
  address: string;
  alias: string;
}

const bakers = ref<Baker[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);
const fetchBakers = async (): Promise<void> => {
  const network = import.meta.env.VITE_NETWORK_TYPE;
  const networkName = import.meta.env.VITE_NETWORK_NAME;

  try {
    loading.value = true;
    error.value = null;

    const baseUrl =
      networkName === "tezlink-shadownet"
        ? "https://api.shadownet.tezlink.tzkt.io"
        : `https://api.${network}.tzkt.io`;
    const response = await fetch(
      `${baseUrl}/v1/delegates?active=true&select=address,alias`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Map to Baker interface, using address as fallback when alias is null
    bakers.value = data.map(
      (baker: { address: string; alias: string | null }) => ({
        address: baker.address,
        alias: baker.alias || baker.address,
      }),
    );
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch bakers";
    console.error("Error fetching bakers:", err);
  } finally {
    loading.value = false;
  }
};

// Computed property to get bakers sorted by alias for better UX
const sortedBakers = computed(() =>
  [...bakers.value].sort((a, b) => a.alias.localeCompare(b.alias)),
);

export function useBakers() {
  return {
    bakers: sortedBakers,
    loading,
    error,
    fetchBakers,
  };
}
