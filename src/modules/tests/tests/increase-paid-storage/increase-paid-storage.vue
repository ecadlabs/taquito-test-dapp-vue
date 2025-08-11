<template>
  <div class="w-full flex flex-col items-center gap-4">
    <div>
      <Label class="mb-1">Contract Address</Label>
      <Input
        placeholder="Contract address..."
        v-model="contractAddress"
        class="w-48"
      />
    </div>

    <div>
      <NumberField :min="1" :max="10" v-model="bytes">
        <Label>Bytes</Label>
        <NumberFieldContent class="w-48">
          <NumberFieldDecrement />
          <NumberFieldInput />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>
    </div>
    <Button @click="increase()" :disabled="processing" class="w-32">
      <Loader2 v-if="processing" class="w-4 h-4 mr-2 animate-spin" />
      <p v-else>Increase Storage</p>
    </Button>
  </div>
</template>

<script setup lang="ts">
import { useDiagramStore } from "@/stores/diagramStore";
import { ref, onMounted } from "vue";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  NumberField,
  NumberFieldContent,
  NumberFieldDecrement,
  NumberFieldIncrement,
  NumberFieldInput,
} from "@/components/ui/number-field";
import { Loader2 } from "lucide-vue-next";
import { increaseStorage } from "@/modules/tests/tests/increase-paid-storage/increase-paid-storage";
// Seoulnet
const contractAddress = ref<string>("KT1RLWdB5zJcN7RVqu5MRWp3gvkMUGEpuc1d");
const bytes = ref<number>(1);
const processing = ref<boolean>(false);
const diagramStore = useDiagramStore();

onMounted(() => {
  diagramStore.setTestDiagram("transfer");
});

const increase = async () => {
  if (!contractAddress.value) return;

  try {
    processing.value = true;
    await increaseStorage(contractAddress.value, bytes.value);
  } catch (error) {
    console.error(error);
  } finally {
    processing.value = false;
  }
};
</script>
