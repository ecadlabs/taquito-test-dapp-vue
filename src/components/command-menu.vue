<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Search for a test..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Tests">
        <RouterLink
          :to="{ name: 'tests', params: { test: test.value } }"
          v-for="test in tests"
        >
          <CommandItem :value="test.value" @click="open = false">
            {{ test.label }}
          </CommandItem>
        </RouterLink>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<script setup lang="ts">
import { useMagicKeys } from "@vueuse/core";
import { AvailableTests } from "@/modules/tests/tests";
import { computed, ref, watch } from "vue";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

const open = ref(false);

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
</script>
