<template>
  <div>
    <DialogHeader>
      <DialogTitle>Connect Your Ledger Device</DialogTitle>
      <DialogDescription>
        Before connecting your Ledger device, please ensure the following:
      </DialogDescription>
    </DialogHeader>

    <div class="mt-4 space-y-4">
      <div class="space-y-3">
        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
          >
            <FlaskConical class="size-3 text-blue-600" />
          </div>
          <div>
            <h4 class="text-sm font-medium">
              Enable Chrome Experimental Features
            </h4>
            <p class="text-muted-foreground mt-1 text-sm">
              Enable the
              <code class="bg-muted rounded px-1 py-0.5 font-mono text-xs"
                >enable-experimental-web-platform-features</code
              >
              Chrome flag by visiting
              <a
                href="https://developer.chrome.com/docs/web-platform/chrome-flags"
                target="_blank"
                class="text-blue-400 hover:underline"
              >
                chrome://flags
              </a>
              and searching for this flag.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
          >
            <Cable class="size-3 text-blue-600" />
          </div>
          <div>
            <h4 class="text-sm font-medium">Connect Your Ledger Device</h4>
            <p class="text-muted-foreground mt-1 text-sm">
              Ensure your Ledger device is plugged in and unlocked.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
          >
            <LayoutPanelLeft class="size-3 text-blue-600" />
          </div>
          <div>
            <h4 class="text-sm font-medium">Open Tezos Wallet App</h4>
            <p class="text-muted-foreground mt-1 text-sm">
              Make sure the Tezos Wallet app is open on your Ledger device.
            </p>
          </div>
        </div>

        <div class="flex items-start gap-3">
          <div
            class="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-100"
          >
            <CloudDownload class="size-3 text-blue-600" />
          </div>
          <div>
            <h4 class="text-sm font-medium">Update Your Device</h4>
            <p class="text-muted-foreground mt-1 text-sm">
              Ensure your Ledger device firmware is up to date for the best
              compatibility.
            </p>
          </div>
        </div>
      </div>
    </div>

    <DialogFooter class="flex gap-2">
      <Button variant="outline" @click="$emit('back')"> Back </Button>
      <Button
        variant="secondary"
        @click="$emit('connect')"
        :disabled="loading || !hidSupported"
        :aria-busy="loading"
      >
        <Loader2 v-if="loading" class="mr-2 h-4 w-4 animate-spin" />
        <p>Connect</p>
      </Button>
    </DialogFooter>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Cable,
  CloudDownload,
  FlaskConical,
  LayoutPanelLeft,
  Loader2,
} from "lucide-vue-next";

interface Props {
  loading?: boolean;
  hidSupported?: boolean;
}

interface Emits {
  (e: "back"): void;
  (e: "connect"): void;
}

withDefaults(defineProps<Props>(), {
  loading: false,
  hidSupported: true,
});

defineEmits<Emits>();
</script>
