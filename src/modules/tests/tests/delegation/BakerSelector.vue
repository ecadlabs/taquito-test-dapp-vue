<template>
  <Popover v-model:open="isPopoverOpen">
    <PopoverTrigger as-child>
      <Button
        variant="outline"
        role="combobox"
        :aria-expanded="isPopoverOpen"
        class="w-full justify-between font-mono text-sm"
      >
        <span v-if="selectedBakerInfo" class="truncate">
          {{ selectedBakerInfo.alias }} ({{
            selectedBakerInfo.address.slice(0, 8)
          }}...{{ selectedBakerInfo.address.slice(-4) }})
        </span>
        <span v-else class="text-muted-foreground">
          {{ placeholder }}
        </span>
        <ChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    </PopoverTrigger>
    <PopoverContent class="w-full p-0">
      <Command>
        <CommandInput placeholder="Search bakers..." v-model="searchQuery" />
        <CommandList>
          <CommandEmpty v-if="loadingBakers">Loading bakers...</CommandEmpty>
          <CommandEmpty v-else-if="searchQuery && filteredBakers.length === 0"
            >No bakers found.</CommandEmpty
          >
          <CommandGroup>
            <CommandItem
              v-for="baker in filteredBakers"
              :key="baker.address"
              :value="baker.alias"
              @select="selectBaker(baker.address)"
              class="cursor-pointer"
            >
              <div class="flex flex-col">
                <span class="font-medium">{{ baker.alias }}</span>
                <span class="text-muted-foreground font-mono text-xs">
                  {{ baker.address.slice(0, 8) }}...{{
                    baker.address.slice(-4)
                  }}
                </span>
              </div>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </PopoverContent>
  </Popover>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useBakers } from "@/composables/useBakers";
import { ChevronsUpDown } from "lucide-vue-next";
import { computed, onMounted, ref, watch } from "vue";

interface Props {
  selectedBaker: string;
  placeholder?: string;
  modelValue?: boolean;
}

interface Emits {
  (e: "update:selectedBaker", value: string): void;
  (e: "update:modelValue", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: "Select a baker...",
});

const emit = defineEmits<Emits>();

const { bakers, loading: loadingBakers, fetchBakers } = useBakers();

onMounted(async () => {
  await fetchBakers();
});
const searchQuery = ref<string>("");
const isPopoverOpen = ref<boolean>(false);

// Watch for external popover state changes
watch(
  () => props.modelValue,
  (newValue) => {
    isPopoverOpen.value = newValue;
  },
);

// Emit popover state changes
watch(
  () => isPopoverOpen.value,
  (newValue) => {
    emit("update:modelValue", newValue);
  },
);

const selectedBakerInfo = computed(() => {
  if (!props.selectedBaker) return null;
  return bakers.value.find((baker) => baker.address === props.selectedBaker);
});

const filteredBakers = computed(() => {
  if (!searchQuery.value) return bakers.value;
  return bakers.value.filter(
    (baker) =>
      baker.alias.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
      baker.address.toLowerCase().includes(searchQuery.value.toLowerCase()),
  );
});

const selectBaker = (bakerAddress: string) => {
  emit("update:selectedBaker", bakerAddress);
  searchQuery.value = "";
  isPopoverOpen.value = false;
};
</script>
