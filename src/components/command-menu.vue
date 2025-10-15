<template>
  <CommandDialog v-model:open="open">
    <CommandInput placeholder="Search for a test..." />
    <CommandList>
      <CommandEmpty>No results found.</CommandEmpty>
      <CommandGroup heading="Pages">
        <CommandItem
          v-for="page in pages"
          :key="page.value"
          :value="page.value"
          @select="() => handleSelect(page.value, false)"
        >
          <Component :is="page.icon" class="size-4" />
          <p>{{ page.label }}</p>
        </CommandItem>
      </CommandGroup>
      <CommandGroup heading="Tests">
        <CommandItem
          v-for="test in tests"
          :key="test.value"
          :value="test.value"
          @select="() => handleSelect(test.value, true)"
        >
          <Component :is="test.icon" class="size-4" />
          <p>{{ test.label }}</p>
        </CommandItem>
      </CommandGroup>
    </CommandList>
  </CommandDialog>
</template>

<script setup lang="ts">
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { AvailableTests } from "@/modules/tests/tests";
import { useMagicKeys } from "@vueuse/core";
import { BookOpenIcon, HandCoinsIcon, HomeIcon } from "lucide-vue-next";
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";

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
    icon: test.icon,
  }));
});

const handleSelect = (id: string, test: boolean = false) => {
  open.value = false;

  if (test) {
    router.push({ name: "tests", params: { test: id } });
  } else {
    router.push({ name: id });
  }
};

const pages = computed(() => {
  return [
    { label: "Home", value: "home", icon: HomeIcon },
    { label: "Faucet", value: "faucet", icon: HandCoinsIcon },
    {
      label: "Taquito Documentation",
      value: "documentation",
      icon: BookOpenIcon,
    },
  ];
});
</script>
