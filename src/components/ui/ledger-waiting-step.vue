<template>
  <div>
    <DialogHeader>
      <DialogTitle>Waiting for Ledger Device Confirmation</DialogTitle>
    </DialogHeader>

    <!-- Centered waiting content -->
    <div class="flex flex-col items-center justify-center space-y-6 py-8">
      <!-- Large animated icon -->
      <div class="relative">
        <div
          class="flex h-20 w-20 items-center justify-center rounded-full bg-blue-100"
        >
          <Loader2 class="h-12 w-12 animate-spin text-blue-600" />
        </div>
        <!-- Pulse effect -->
        <div
          class="absolute inset-0 h-20 w-20 animate-ping rounded-full bg-blue-100 opacity-20"
        ></div>
      </div>

      <!-- Main message -->
      <div class="space-y-2 text-center">
        <h3 class="text-lg font-medium text-gray-900">
          Waiting for Approval...
        </h3>
        <p class="max-w-sm text-sm text-gray-600">
          Look for the connection request on your Ledger device screen.
        </p>
      </div>
    </div>

    <DialogFooter>
      <Button variant="outline" @click="reload()"> Cancel </Button>
    </DialogFooter>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2 } from "lucide-vue-next";

interface Props {
  loading?: boolean;
}

withDefaults(defineProps<Props>(), {
  loading: false,
});

const reload = () => {
  window.location.reload();
};
</script>
