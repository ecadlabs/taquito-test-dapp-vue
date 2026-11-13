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

      <TooltipProvider v-if="network">
        <Tooltip>
          <TooltipTrigger as-child>
            <Badge
              variant="outline"
              as="button"
              type="button"
              class="h-fit cursor-pointer items-center gap-1.5"
              :aria-label="`${network} RPC status: ${settingsStore.rpcHealthSummary}`"
              @click="showSettingsDialog = true"
            >
              <span
                class="size-2 rounded-full"
                :class="{
                  'animate-pulse bg-amber-400':
                    settingsStore.rpcHealthStatus === 'checking',
                  'bg-green-400': settingsStore.rpcHealthStatus === 'healthy',
                  'bg-red-500': settingsStore.rpcHealthStatus === 'unhealthy',
                }"
                aria-hidden="true"
              />
              <span>{{ network }}</span>
              <span v-if="networkName && networkName !== network"
                >({{ networkName }})</span
              >
            </Badge>
          </TooltipTrigger>
          <TooltipContent class="space-y-0.5">
            <p class="font-medium">{{ settingsStore.rpcHealthSummary }}</p>
            <p class="opacity-80">{{ settingsStore.settings.rpcUrl }}</p>
            <p v-if="settingsStore.isUsingCustomRpcUrl" class="text-orange-300">
              Custom RPC URL active
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
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
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="icon"
            :variant="inspector.isOpen ? 'secondary' : 'outline'"
            class="ml-2"
            :aria-label="
              inspector.isOpen
                ? 'Close Beacon inspector'
                : 'Open Beacon inspector'
            "
            :aria-pressed="inspector.isOpen"
            @click="inspector.toggle()"
          >
            <Radar class="size-5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Beacon inspector</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger as-child>
          <Button
            size="icon"
            variant="outline"
            class="relative ml-2"
            @click="showSettingsDialog = true"
            aria-label="Settings"
          >
            <div
              v-if="
                !settingsStore.isRpcHealthy || settingsStore.isUsingCustomRpcUrl
              "
              class="absolute -top-1 -right-1 size-3 rounded-full"
              :class="
                !settingsStore.isRpcHealthy ? 'bg-red-500' : 'bg-orange-400'
              "
            />
            <Settings class="size-5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p v-if="!settingsStore.isRpcHealthy">
            Settings ({{ settingsStore.rpcHealthSummary }})
          </p>
          <p v-else-if="settingsStore.isUsingCustomRpcUrl">
            Settings (Custom RPC URL active)
          </p>
          <p v-else>Settings ({{ settingsStore.rpcHealthSummary }})</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>

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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { AvailableTests } from "@/modules/tests/tests";
import { useBeaconInspectorStore } from "@/stores/inspectorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { Menu, Radar, Settings } from "lucide-vue-next";
import { computed, ref, watch } from "vue";

const settingsStore = useSettingsStore();
const inspector = useBeaconInspectorStore();

const showSettingsDialog = ref<boolean>(false);

const network = ref<string>(import.meta.env.VITE_NETWORK_TYPE);
const networkName = ref<string>(import.meta.env.VITE_NETWORK_NAME);

const firstTestId = computed(() => {
  return Object.values(AvailableTests)[0].id;
});

const openDocumentation = () => {
  window.open("https://taquito.io/docs/quick_start");
};

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
