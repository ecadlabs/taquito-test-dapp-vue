import { computed, ref } from "vue";

const bakers = ref<Baker[]>([]);
const loading = ref<boolean>(false);
const error = ref<string | null>(null);

interface Baker {
  address: string;
  alias: string;
}

const fetchBakers = async (): Promise<void> => {
  const network = import.meta.env.VITE_NETWORK_TYPE;

  try {
    loading.value = true;
    error.value = null;

    const response = await fetch(
      `https://api.${network}.tzkt.io/v1/delegates?active=true&select=address,alias`,
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Filter out bakers with null aliases and map to our Baker interface
    bakers.value = data
      .filter(
        (baker: { address: string; alias: string | null }) =>
          baker.alias !== null && baker.alias !== "",
      )
      .map((baker: { address: string; alias: string }) => ({
        address: baker.address,
        alias: baker.alias,
      }));
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
