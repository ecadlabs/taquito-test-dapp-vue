<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Search for a test..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Tests">
        <CommandItem
          v-for="test in tests"
          :key="test.value"
          :value="test.value"
          @select="() => handleSelect(test.value)"
        >
          {{ test.label }}
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<script setup lang="ts">
import { useMagicKeys } from "@vueuse/core";
import { AvailableTests } from "@/modules/tests/tests";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const open = ref(false);
const router = useRouter();

const { Meta_K, Ctrl_K } = useMagicKeys({
  passive: false,
  onEventFired(e) {
    if (e.key === "k" && (e.metaKey || e.ctrlKey)) e.preventDefault();
  },
});

watch([Meta_K, Ctrl_K], (v) => {
  if (v[0] || v[1]) handleOpenChange();
});

function handleOpenChange() {
  open.value = !open.value;
}

const tests = computed(() => {
  return Object.values(AvailableTests).map((test) => ({
    label: test.title,
    value: test.id,
  }));
});

const handleSelect = (id: string) => {
  open.value = false;
  router.push({ name: "tests", params: { test: id } });
};
</script>
