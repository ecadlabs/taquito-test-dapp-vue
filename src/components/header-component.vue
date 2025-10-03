<template>
  <div class="flex items-center p-4 md:justify-between">
    <div class="flex flex-col items-center sm:flex-row">
      <RouterLink
        :to="{ name: 'home' }"
        class="flex items-center gap-1.5 p-2 leading-none font-medium"
      >
        <img src="@/assets/logo.svg" alt="Taquito Logo" class="size-5" />
        <p>Taquito Playground</p>
      </RouterLink>

      <Badge v-if="network" variant="outline" class="h-fit">
        <p>{{ network }}</p>
      </Badge>
    </div>

    <div class="mr-auto" />
    <NavigationMenu class="mr-4 hidden md:block">
      <NavigationMenuList>
        <NavigationMenuItem>
          <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
            <NavigationMenuLink :class="navigationMenuTriggerStyle()">
              Examples
            </NavigationMenuLink>
          </RouterLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <RouterLink :to="{ name: 'faucet' }">
            <NavigationMenuLink :class="navigationMenuTriggerStyle()">
              Faucet
            </NavigationMenuLink>
          </RouterLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink
            href="https://taquito.io/docs/quick_start"
            :class="navigationMenuTriggerStyle()"
          >
            Taquito Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>

    <WalletControl />
    <Button
      size="icon"
      variant="outline"
      class="relative ml-2"
      @click="showSettingsDialog = true"
      aria-label="Settings"
    >
      <div
        v-if="settingsStore.isUsingCustomRpcUrl"
        class="absolute -top-1 -right-1 size-3 rounded-full bg-orange-400"
      />
      <Settings class="size-5" aria-hidden="true" />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger
        class="block hover:cursor-pointer md:hidden"
        aria-label="Open navigation menu"
      >
        <Menu class="ml-3 size-6" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
          <DropdownMenuItem class="hover:cursor-pointer"
            >Examples</DropdownMenuItem
          >
        </RouterLink>
        <RouterLink :to="{ name: 'faucet' }">
          <DropdownMenuItem class="hover:cursor-pointer"
            >Faucet</DropdownMenuItem
          >
        </RouterLink>
        <DropdownMenuItem
          @click.stop="openDocumentation"
          class="hover:cursor-pointer"
          >Taquito Documentation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>

  <Dialog v-model:open="showSettingsDialog">
    <SettingsDialog @close="showSettingsDialog = false" />
  </Dialog>
</template>

<script setup lang="ts">
import SettingsDialog from "@/components/settings-dialog.vue";
import WalletControl from "@/components/wallet-control.vue";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { isRevealed } from "@/lib/utils";
import { AvailableTests } from "@/modules/tests/tests";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { Menu, Settings } from "lucide-vue-next";
import { computed, ref, watch } from "vue";

const settingsStore = useSettingsStore();
const walletStore = useWalletStore();

const showSettingsDialog = ref<boolean>(false);

const network = ref<string>(import.meta.env.VITE_NETWORK_TYPE);

const firstTestId = computed(() => {
  return Object.values(AvailableTests)[0].id;
});

const openDocumentation = () => {
  window.open("https://taquito.io/docs/quick_start");
};

const updateRevealedStatus = async (address: string | undefined) => {
  if (!address) {
    settingsStore.isRevealed = false;
    return;
  }

  try {
    const revealed = await isRevealed(address);
    settingsStore.isRevealed = revealed;
  } catch {
    settingsStore.isRevealed = false;
  }
};

// Watch for wallet address changes and update revealed status
watch(
  () => walletStore.getAddress,
  async (newAddress) => {
    await updateRevealedStatus(newAddress);
  },
);

// Reload the page if the RPC URL has changed to re-initialize the wallet with the new URL
const previousSettings = ref(settingsStore.settings);
watch(
  () => showSettingsDialog.value,
  async (open) => {
    if (open) {
      previousSettings.value = { ...settingsStore.settings };
    } else {
      if (previousSettings.value.rpcUrl !== settingsStore.settings.rpcUrl) {
        window.location.reload();
      }
    }
  },
);
</script>
