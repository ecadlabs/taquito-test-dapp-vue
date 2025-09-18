<template>
  <div class="flex md:justify-between p-4 items-center">
    <div class="flex items-center flex-col sm:flex-row">
      <RouterLink
        :to="{ name: 'home' }"
        class="font-medium leading-none flex gap-1.5 items-center p-2"
      >
        <img src="@/assets/logo.svg" alt="Taquito Logo" class="size-5" />
        <p>Taquito Playground</p>
      </RouterLink>

      <Badge v-if="network" variant="outline" class="h-fit">
        <p>{{ network }}</p>
      </Badge>
    </div>

    <div class="mr-auto" />
    <NavigationMenu class="hidden md:block mr-4">
      <NavigationMenuList>
        <NavigationMenuItem>
          <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
            <NavigationMenuLink :class="navigationMenuTriggerStyle()">
              Examples
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
      class="ml-2 relative"
      @click="showSettingsDialog = true"
      aria-label="Settings"
    >
      <div
        v-if="settingsStore.isUsingCustomRpcUrl"
        class="bg-orange-400 size-3 absolute -top-1 -right-1 rounded-full"
      />
      <Settings class="size-5" aria-hidden="true" />
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger
        class="block md:hidden hover:cursor-pointer"
        aria-label="Open navigation menu"
      >
        <Menu class="size-6 ml-3" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
          <DropdownMenuItem class="hover:cursor-pointer"
            >Examples</DropdownMenuItem
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
import WalletControl from "@/components/wallet-control.vue";
import SettingsDialog from "@/components/settings-dialog.vue";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { AvailableTests } from "@/modules/tests/tests";
import { computed, ref, watch } from "vue";
import { Menu, Settings } from "lucide-vue-next";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import { isRevealed } from "@/lib/utils";

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
