<template>
  <Dialog :open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Transaction Fee Estimate</DialogTitle>
        <DialogDescription>
          <p>
            Detailed breakdown of fees and resource limits for this operation.
            These estimates are provided by Taquito, are for information
            purposes only, and may not match exactly what your wallet estimates.
          </p>
          <p class="mt-2 font-semibold">
            You should always confirm fees via your wallet before submitting a
            transaction.
          </p>
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-6">
        <div class="space-y-3">
          <h3 class="text-foreground text-sm font-semibold">Core Fees</h3>
          <div class="border-border bg-card rounded-md border">
            <div class="divide-border divide-y">
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Suggested Fee</span>
                <span class="text-sm font-medium">{{
                  formatMutez(feeInfo.suggestedFeeMutez)
                }}</span>
              </div>
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Minimal Fee</span>
                <span class="text-sm font-medium">{{
                  formatMutez(feeInfo.minimalFeeMutez)
                }}</span>
              </div>
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Base Fee</span>
                <span class="text-sm font-medium">{{
                  formatMutez(feeInfo.usingBaseFeeMutez)
                }}</span>
              </div>
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Burn Fee</span>
                <span class="text-sm font-medium">{{
                  formatMutez(feeInfo.burnFeeMutez)
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Resource Limits Section -->
        <div class="space-y-3">
          <h3 class="text-foreground text-sm font-semibold">Resource Limits</h3>
          <div class="border-border bg-card rounded-md border">
            <div class="divide-border divide-y">
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Gas Limit</span>
                <span class="font-mono text-sm font-medium">{{
                  feeInfo.gasLimit.toLocaleString()
                }}</span>
              </div>
              <div class="flex items-center justify-between p-3">
                <span class="text-muted-foreground text-sm">Storage Limit</span>
                <span class="font-mono text-sm font-medium">{{
                  feeInfo.storageLimit.toLocaleString()
                }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Cost Section -->
        <div class="border-primary/20 bg-primary/5 rounded-md border p-4">
          <div class="flex items-center justify-between">
            <span class="text-foreground text-sm font-semibold"
              >Total Cost</span
            >
            <span class="text-primary text-base font-bold">{{
              formatMutez(feeInfo.totalCost)
            }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="secondary" @click="handleClose(false)"> Close </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ref, watch } from "vue";

export interface FeeEstimateData {
  burnFeeMutez: number;
  gasLimit: number;
  minimalFeeMutez: number;
  storageLimit: number;
  suggestedFeeMutez: number;
  totalCost: number;
  usingBaseFeeMutez: number;
}

interface Props {
  feeInfo: FeeEstimateData;
  open?: boolean;
}

interface Emits {
  (e: "update:open", value: boolean): void;
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
});

const emit = defineEmits<Emits>();

const isOpen = ref(props.open);

const formatMutez = (mutez: number) => {
  const tez = mutez / 1_000_000;
  return `${mutez.toLocaleString()} μꜩ (${tez.toFixed(6)} ꜩ)`;
};

const handleClose = (open: boolean) => {
  isOpen.value = open;
  emit("update:open", open);
};

watch(
  () => props.open,
  (newValue) => {
    isOpen.value = newValue;
  },
);
</script>
