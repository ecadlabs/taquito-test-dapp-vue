<template>
  <div class="flex w-full flex-col gap-6">
    <!-- Information Alert -->
    <Alert>
      <Info class="h-4 w-4" />
      <AlertTitle>Sapling Shield Operation Demo</AlertTitle>
      <AlertDescription>
        Demonstrates shielding funds from public to private addresses using
        Taquito's Sapling features. Includes real key generation, zero-knowledge
        proof creation (CPU-intensive, 10-30s), and on-chain transaction
        submission. No simulation!
      </AlertDescription>
    </Alert>

    <div class="mx-auto w-full max-w-4xl space-y-6">
      <!-- Contract Deployment Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Zap class="h-5 w-5 text-orange-600" />
            Sapling Contract
          </CardTitle>
          <CardDescription>
            Deploy a contract that accepts Sapling transactions for the shield
            operation demo
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center gap-2">
            <Input
              v-model="contractAddress"
              placeholder="KT1... (empty until deployed)"
              class="flex-1 font-mono text-sm"
              :disabled="isRunning"
            />
            <Button
              size="icon"
              variant="ghost"
              @click="handleCopyToClipboard(contractAddress)"
              :disabled="!contractAddress"
            >
              <Copy class="h-4 w-4" />
            </Button>
          </div>
          <Button
            @click="deployContract"
            :disabled="!walletConnected || isRunning"
            class="w-full"
          >
            <Rocket class="mr-2 h-4 w-4" />
            Deploy Sapling Contract
          </Button>
          <div
            v-if="contractAddress"
            class="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3"
          >
            <code class="flex-1 font-mono text-xs break-all">
              {{ contractAddress }}
            </code>
            <Button
              size="icon"
              variant="ghost"
              @click="handleCopyToClipboard(contractAddress)"
            >
              <Copy class="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <!-- Key Generation Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Key class="h-5 w-5 text-purple-600" />
            Sapling Key Management
          </CardTitle>
          <CardDescription>
            Generate spending keys and payment addresses for Alice and Bob
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button
            @click="generateKeys"
            :disabled="!walletConnected || isRunning"
            class="w-full"
          >
            <Zap class="mr-2 h-4 w-4" />
            Generate Keys
          </Button>

          <div v-if="saplingKeys.aliceAddress" class="space-y-3">
            <div class="text-sm">
              <Label class="font-medium text-gray-700">Alice's Address:</Label>
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all"
                >
                  {{ saplingKeys.aliceAddress }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="handleCopyToClipboard(saplingKeys.aliceAddress)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div class="text-sm">
              <Label class="font-medium text-gray-700">Bob's Address:</Label>
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="flex-1 rounded border bg-white px-3 py-2 font-mono text-xs break-all"
                >
                  {{ saplingKeys.bobAddress }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="handleCopyToClipboard(saplingKeys.bobAddress)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Operations Section -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Lock class="h-5 w-5 text-green-600" />
            Shield Operation
          </CardTitle>
          <CardDescription>
            Move tez from public to private address using zero-knowledge proof
            (10-30s proof generation)
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <!-- Shield -->
          <div class="space-y-2">
            <Label>Shield (Public → Private)</Label>
            <div class="flex gap-2">
              <Input
                v-model.number="shieldAmount"
                type="number"
                placeholder="Amount"
                step="0.1"
                min="0.1"
                :disabled="isRunning"
              />
              <Button
                @click="executeShield"
                :disabled="
                  !walletConnected ||
                  !contractAddress ||
                  !saplingKeys.aliceAddress ||
                  isRunning
                "
              >
                <ArrowRight class="mr-2 h-4 w-4" />
                Shield
              </Button>
            </div>
          </div>

          <!-- Transfer and Unshield operations hidden - not supported by minimal contract -->
          <!-- These would require sapling_state storage for balance tracking -->
        </CardContent>
      </Card>

      <!-- Balances and Complete Workflow sections removed for cleaner shield-only demo -->
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyToClipboard } from "@/lib/utils";
import {
  deploySaplingContract,
  generateSaplingKeys,
  shieldOperation,
  type SaplingKeys,
} from "@/modules/tests/tests/sapling/sapling-single-state";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import { Copy, Info, Key, Lock, Rocket, Zap } from "lucide-vue-next";
import { computed, onMounted, ref, shallowRef } from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();

const walletConnected = computed(() => !!walletStore.getAddress);
const isRunning = ref(false);

const contractAddress = ref("");
// Use shallowRef to preserve private class members (Vue's deep reactivity breaks them)
const saplingKeys = shallowRef<{
  keys?: SaplingKeys;
  aliceAddress: string;
  bobAddress: string;
}>({
  aliceAddress: "",
  bobAddress: "",
});

const shieldAmount = ref(3);

onMounted(() => {
  diagramStore.setTestDiagram("sapling-single-state", "complete-workflow");
});

const handleCopyToClipboard = async (text: string) => {
  await copyToClipboard(text);
};

const deployContract = async () => {
  if (!walletStore.getTezos) return;

  try {
    isRunning.value = true;
    diagramStore.setTestDiagram("sapling-single-state", "deploy");
    diagramStore.setProgress("deploy-contract");

    toast.info("Deploying Sapling contract...");
    const address = await deploySaplingContract(walletStore.getTezos);
    contractAddress.value = address;

    diagramStore.setCompleted();
    toast.success(`Contract deployed: ${address.substring(0, 10)}...`);
  } catch (error) {
    console.error("Deployment error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const generateKeys = async () => {
  try {
    isRunning.value = true;
    // Key generation is fast, just show the complete workflow diagram
    diagramStore.setTestDiagram("sapling-single-state", "complete-workflow");
    diagramStore.setProgress("generate-keys");

    toast.info("Generating Sapling keys...");
    const keys = await generateSaplingKeys();
    saplingKeys.value = {
      keys,
      aliceAddress: keys.aliceAddress,
      bobAddress: keys.bobAddress,
    };

    diagramStore.setCompleted();
    toast.success("Keys generated successfully");
  } catch (error) {
    console.error("Key generation error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const executeShield = async () => {
  if (!walletStore.getTezos || !saplingKeys.value.keys) return;

  try {
    isRunning.value = true;
    diagramStore.setTestDiagram("sapling-single-state", "shield");
    diagramStore.setProgress("shield");

    toast.info("Shielding tez (generating zero-knowledge proof)...");
    const opHash = await shieldOperation(
      walletStore.getTezos,
      contractAddress.value,
      saplingKeys.value.keys!,
      shieldAmount.value,
    );

    diagramStore.setProgress("verify-shield");
    // Balance tracking not supported by minimal contract

    diagramStore.setCompleted();
    diagramStore.setOperationHash(opHash);
    toast.success("Shield operation completed");
  } catch (error) {
    console.error("Shield error:", error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

// Transfer and Unshield functions removed - not supported by minimal contract
// Shield operation provides complete demonstration of Taquito Sapling features

// Balance tracking, transfer, unshield, and complete workflow removed
// Shield operation provides focused, working demonstration
</script>
