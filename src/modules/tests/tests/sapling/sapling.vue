<template>
  <div class="flex w-full flex-col gap-6">
    <div class="mx-auto w-full max-w-4xl space-y-6">
      <Alert>
        <AlertTitle class="flex items-center gap-2">
          <TriangleAlert class="size-4" />
          Heads up!
        </AlertTitle>
        <AlertDescription>
          Shield, transfer, and unshield operations take 10-30 seconds to
          complete due to the need to generate zero-knowledge proofs. If the
          proving params are not ready yet, the first proof-generating action
          may also download them from <code>sapling.taquito.io</code>. The page
          may freeze for a few seconds during proof generation.
        </AlertDescription>
      </Alert>
      <Card data-testid="sapling-runtime-status">
        <CardHeader class="gap-3">
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <Download class="size-4" />
              Sapling Runtime Status
            </CardTitle>
            <CardDescription>
              Key generation and viewing work without proving params. Shield,
              transfer, and unshield will lazy-load a large proving-params
              bundle on first use unless you preload it here.
            </CardDescription>
          </div>
          <CardAction>
            <Button
              variant="outline"
              size="sm"
              :disabled="preloadButtonDisabled"
              @click="handlePreloadSaplingParams"
              data-testid="sapling-preload-button"
            >
              <span
                v-if="saplingRuntimeState.kind === 'params-preloading'"
                class="sapling-spinner sapling-spinner-sm"
                aria-hidden="true"
              ></span>
              <Check
                v-else-if="saplingRuntimeState.kind === 'params-ready'"
                class="size-4"
              />
              <Download v-else class="size-4" />
              {{ preloadButtonLabel }}
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-3 md:grid-cols-2">
            <div class="rounded-lg border p-3">
              <div
                class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Runtime
              </div>
              <div class="mt-2 flex items-center gap-2">
                <Badge :variant="runtimeModuleBadgeVariant">
                  {{ runtimeModuleBadgeLabel }}
                </Badge>
                <span
                  class="text-sm font-medium"
                  data-testid="sapling-runtime-module-status"
                >
                  {{ runtimeModuleStatusText }}
                </span>
              </div>
            </div>
            <div class="rounded-lg border p-3">
              <div
                class="text-muted-foreground text-xs font-medium tracking-wide uppercase"
              >
                Proving params
              </div>
              <div class="mt-2 flex items-center gap-2">
                <Badge :variant="runtimeParamsBadgeVariant">
                  {{ runtimeParamsBadgeLabel }}
                </Badge>
                <span
                  class="text-sm font-medium"
                  data-testid="sapling-runtime-params-status"
                >
                  {{ runtimeParamsStatusText }}
                </span>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-dashed p-3">
            <div class="text-sm font-medium">{{ runtimeDetailHeadline }}</div>
            <div class="text-muted-foreground mt-1 text-sm">
              {{ runtimeDetailText }}
            </div>
            <div
              v-if="runtimeCompletionText"
              class="text-muted-foreground mt-2 text-xs"
            >
              {{ runtimeCompletionText }}
            </div>
          </div>

          <div
            class="text-muted-foreground rounded-lg border border-dashed p-3 text-sm"
          >
            Suggested flow:
            <span class="text-foreground font-medium"> Shield </span>
            ,
            <span class="text-foreground font-medium"> check balance </span>
            ,
            <span class="text-foreground font-medium"> inspect history </span>
            ,
            <span class="text-foreground font-medium"> transfer </span>
            ,
            <span class="text-foreground font-medium">
              inspect history again
            </span>
            , then
            <span class="text-foreground font-medium"> unshield </span>
            .
          </div>

          <div class="rounded-lg border border-dashed p-3">
            <div class="text-sm font-medium">Reset for a true cold start</div>
            <div class="text-muted-foreground mt-1 text-sm">
              Clearing site data for this dApp is not enough because the proving
              params are fetched from <code>sapling.taquito.io</code> and then
              cached by the browser.
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="isRunning"
                @click="handleReloadWithFreshSaplingParams"
                data-testid="sapling-fresh-reload-button"
              >
                <RotateCcw class="size-4" />
                Reset Sapling Session
              </Button>
            </div>
            <ul class="text-muted-foreground mt-3 space-y-1 text-sm">
              <li>
                1. Close this tab or hard reload to clear in-memory params.
              </li>
              <li>
                2. Use <code>Reset Sapling Session</code> above to clear the
                current Sapling page state and force cache-busting Sapling param
                URLs on reload, or enable <code>Disable cache</code> in DevTools
                Network.
              </li>
              <li>
                3. Clearing browser cached files still works if you want the
                underlying cache gone.
              </li>
              <li>
                4. For the cleanest repro, use a fresh Incognito window or
                browser profile.
              </li>
            </ul>
          </div>

          <Alert
            v-if="runtimeErrorMessage"
            variant="destructive"
            data-testid="sapling-runtime-error"
          >
            <TriangleAlert class="size-4" />
            <AlertTitle>Preload failed</AlertTitle>
            <AlertDescription>{{ runtimeErrorMessage }}</AlertDescription>
          </Alert>

          <div
            v-if="saplingRuntimeState.kind === 'params-preloading'"
            class="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4"
          >
            <div class="flex items-center gap-4">
              <div class="relative text-sky-700">
                <span
                  class="sapling-spinner sapling-spinner-lg"
                  aria-hidden="true"
                ></span>
                <span class="sapling-spinner-dot" aria-hidden="true"></span>
              </div>
              <div class="space-y-1">
                <div class="text-sm font-medium text-sky-950">
                  Downloading proving params
                </div>
                <div class="text-sm text-sky-900">
                  Pulling the Sapling proving bundle from
                  <code class="rounded bg-white/80 px-1 py-0.5 text-xs"
                    >sapling.taquito.io</code
                  >
                  so later proof-generating actions can skip this step.
                </div>
              </div>
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div class="sapling-indeterminate-bar bg-primary h-full" />
            </div>
            <div class="text-xs text-sky-900/80">
              The runtime does not expose real byte-level progress, so this
              stays indeterminate.
            </div>
          </div>
        </CardContent>
      </Card>
      <!-- Sapling Addresses -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Key class="size-4" />
            Sapling Addresses
          </CardTitle>
          <CardDescription>
            Keys automatically generated for this test session. The spending key
            can both view your notes and authorize private spends.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="userKey" class="space-y-3">
            <div class="text-sm">
              <Label class="font-medium text-gray-700 dark:text-gray-300"
                >Your Spending Key (Mnemonic):</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                >
                  {{ userKey.mnemonic }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(userKey.mnemonic)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div class="text-sm">
              <Label class="font-medium text-gray-700 dark:text-gray-300"
                >Your Sapling Address:</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                >
                  {{ userKey.address }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(userKey.address)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div v-if="aliceAddress" class="space-y-3">
            <div class="text-sm">
              <Label class="font-medium text-gray-700 dark:text-gray-300"
                >Alice's Sapling Address:</Label
              >
              <div class="mt-1 flex items-center gap-2">
                <code
                  class="bg-background border-input flex-1 rounded border px-3 py-2 font-mono text-xs break-all text-gray-900 dark:text-gray-100"
                >
                  {{ aliceAddress }}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  @click="copyToClipboard(aliceAddress)"
                >
                  <Copy class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div v-if="!userKey || !aliceAddress" class="text-sm text-gray-500">
            Generating keys...
          </div>
        </CardContent>
      </Card>

      <!-- Shield Tez -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Lock class="size-4" />
            Shield Tez
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 1</Badge>
          </CardAction>
          <CardDescription>
            Move tez from your public account into the Sapling pool, this
            creates your first private note. If proving params are not ready,
            first use will download them before the proof is built.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="shieldAmount"
              type="number"
              placeholder="3"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey"
            />
          </div>
          <Button
            @click="handleShieldToUser"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-shield-button"
          >
            <Lock class="mr-2 h-4 w-4" />
            Shield Tez
          </Button>
        </CardContent>
      </Card>

      <!-- Get Balance -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Wallet class="size-4" />
            Shielded Pool Balance
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 2</Badge>
          </CardAction>
          <CardDescription>
            Viewing-only check, confirm the shielded note is visible to your
            spending key. This flow does not need proving params.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button
            @click="handleGetBalance"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-balance-button"
          >
            <Wallet class="mr-2 h-4 w-4" />
            Get Balance
          </Button>
          <div v-if="userBalance !== null" class="space-y-2">
            <div class="rounded-lg border bg-white p-3">
              <div class="text-sm font-medium text-gray-700">Your Balance:</div>
              <div class="text-2xl font-bold">
                {{ formatBalance(userBalance) }} ꜩ
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Get Transaction History -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <History class="size-4" />
            Transaction History
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 3</Badge>
          </CardAction>
          <CardDescription>
            Viewing-only check, inspect incoming notes, outgoing notes, and
            change behavior without generating a proof. Run it after shielding
            and again after transferring to compare the note flow.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <Button
            @click="handleGetTransactionHistory"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-history-button"
          >
            <History class="mr-2 h-4 w-4" />
            Get Transaction History
          </Button>
          <div v-if="transactionHistory" class="space-y-3">
            <!-- Info Note -->
            <div class="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <div class="mb-1 text-sm font-medium text-blue-900">
                Why are there so many transactions?
              </div>
              <div class="text-xs text-blue-800">
                Sapling uses a UTXO model (like Bitcoin). When spending, you
                must consume entire "notes" (like bills) and create change back
                to yourself. A single transfer may show as multiple
                transactions: one spending the full amount and another receiving
                change.
              </div>
            </div>

            <!-- Transaction Count -->
            <div class="rounded-lg border bg-white p-3">
              <div class="mb-1 text-sm font-medium text-gray-700">
                Total Transactions:
              </div>
              <div class="text-2xl font-bold">
                {{ transactionHistory.total }}
              </div>
            </div>

            <!-- Transaction List -->
            <div class="space-y-1.5">
              <div
                v-for="(tx, index) in transactionHistory.transactions"
                :key="`tx-${index}`"
                :class="[
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  tx.type === 'incoming'
                    ? 'border-green-200 bg-green-50'
                    : 'border-red-200 bg-red-50',
                ]"
              >
                <div class="flex items-center gap-2">
                  <span
                    :class="[
                      'font-medium',
                      tx.type === 'incoming'
                        ? 'text-green-800'
                        : 'text-red-800',
                    ]"
                  >
                    {{ tx.type === "incoming" ? "+" : "-" }}
                    {{ formatBalance(tx.amount) }} ꜩ
                  </span>
                  <span v-if="tx.memo" class="text-xs text-gray-600">
                    ({{ tx.memo }})
                  </span>
                </div>
                <span class="text-xs text-gray-500">
                  {{ tx.type === "incoming" ? "In" : "Out" }}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Transfer to Alice -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ArrowRightLeft class="size-4" />
            Transfer to Alice
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 4</Badge>
          </CardAction>
          <CardDescription>
            Spend your private note to Alice's Sapling address. This is where
            Sapling's note selection and change-note behavior becomes visible.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="transferAmount"
              type="number"
              placeholder="1"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey || !aliceAddress"
            />
          </div>
          <Button
            @click="handleTransferToAlice"
            :disabled="
              !walletConnected ||
              !contractAddress ||
              !userKey ||
              !aliceAddress ||
              isRunning
            "
            class="w-full"
            data-testid="sapling-transfer-button"
          >
            <ArrowRightLeft class="mr-2 h-4 w-4" />
            Transfer to Alice
          </Button>
        </CardContent>
      </Card>

      <!-- Unshield to User's tz1 -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Unlock class="size-4" />
            Unshield to Your tz1 Address
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 5</Badge>
          </CardAction>
          <CardDescription>
            Exit the Sapling pool by sending funds back to your public tz1
            address. This is another proof-generating step.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-2">
            <Label>Amount (ꜩ)</Label>
            <Input
              v-model.number="unshieldAmount"
              type="number"
              placeholder="1"
              step="0.1"
              min="0.1"
              :disabled="isRunning || !userKey"
            />
          </div>
          <Button
            @click="handleUnshieldToUser"
            :disabled="
              !walletConnected || !contractAddress || !userKey || isRunning
            "
            class="w-full"
            data-testid="sapling-unshield-button"
          >
            <Unlock class="mr-2 h-4 w-4" />
            Unshield Tez
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge, type BadgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { copyToClipboard } from "@/lib/utils";
import {
  generateAliceAddress,
  generateUserSpendingKey,
  getSaplingErrorMessage,
  getSaplingRuntimeSnapshot,
  getUserSaplingBalance,
  getUserTransactionHistory,
  isSaplingParamsError,
  markSaplingProvingParamsFailed,
  markSaplingProvingParamsReady,
  preloadSaplingProvingParams,
  reloadWithFreshSaplingParams,
  shieldToUser,
  transferToAlice,
  unshieldToUser,
  type SaplingRuntimeSnapshot,
  type SaplingTransactionHistory,
  type UserSaplingKey,
} from "@/modules/tests/tests/sapling/sapling";
import { getContractAddress } from "@/networks/network-registry";
import { useDiagramStore } from "@/stores/diagramStore";
import { useWalletStore } from "@/stores/walletStore";
import {
  ArrowRightLeft,
  Check,
  Copy,
  Download,
  History,
  Key,
  Lock,
  RotateCcw,
  TriangleAlert,
  Unlock,
  Wallet,
} from "lucide-vue-next";
import { computed, nextTick, onMounted, ref, shallowRef } from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const walletStore = useWalletStore();
const networkId =
  import.meta.env.VITE_NETWORK_NAME || import.meta.env.VITE_NETWORK_TYPE;

const walletConnected = computed(() => !!walletStore.getAddress);
const isRunning = ref(false);
const isReloadingSaplingSession = ref(false);
type BadgeVariant = NonNullable<BadgeVariants["variant"]>;
type SaplingRuntimeUiState =
  | { kind: "booting" }
  | { kind: "module-error"; errorMessage: string }
  | { kind: "params-idle" }
  | { kind: "params-preloading" }
  | { kind: "params-ready"; elapsedMs: number | null }
  | { kind: "params-error"; errorMessage: string };

const contractAddress = ref("");
// Use shallowRef to preserve private class members
const userKey = shallowRef<UserSaplingKey | null>(null);
const aliceAddress = ref("");
const saplingRuntimeState = ref<SaplingRuntimeUiState>({ kind: "booting" });

// Amounts (in tez)
const shieldAmount = ref(3);
const transferAmount = ref(1);
const unshieldAmount = ref(1);

// Results
const transactionHistory = ref<SaplingTransactionHistory | null>(null);
const userBalance = ref<number | null>(null);

// Get contract address from config
const CONTRACT_ADDRESS = getContractAddress("sapling", networkId) ?? "";

const syncSaplingRuntimeState = (snapshot: SaplingRuntimeSnapshot) => {
  if (snapshot.moduleStatus === "failed") {
    saplingRuntimeState.value = {
      kind: "module-error",
      errorMessage: snapshot.errorMessage ?? "Failed to load Sapling runtime",
    };
    return;
  }

  switch (snapshot.paramsStatus) {
    case "preloading":
      saplingRuntimeState.value = { kind: "params-preloading" };
      return;
    case "ready":
      saplingRuntimeState.value = {
        kind: "params-ready",
        elapsedMs: snapshot.lastPreloadDurationMs,
      };
      return;
    case "failed":
      saplingRuntimeState.value = {
        kind: "params-error",
        errorMessage:
          snapshot.errorMessage ?? "Failed to preload Sapling proving params",
      };
      return;
    default:
      saplingRuntimeState.value =
        snapshot.moduleStatus === "ready"
          ? { kind: "params-idle" }
          : { kind: "booting" };
  }
};

const formatElapsedMs = (elapsedMs: number): string => {
  if (elapsedMs < 1000) {
    return `${Math.round(elapsedMs)} ms`;
  }

  return `${(elapsedMs / 1000).toFixed(1)}s`;
};

const runtimeModuleBadgeVariant = computed<BadgeVariant>(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "destructive";
    case "booting":
      return "outline";
    default:
      return "secondary";
  }
});

const runtimeModuleBadgeLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Failed";
    case "booting":
      return "Loading";
    default:
      return "Ready";
  }
});

const runtimeModuleStatusText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Sapling module failed";
    case "booting":
      return "Loading Sapling module...";
    default:
      return "Sapling module ready";
  }
});

const runtimeParamsBadgeVariant = computed<BadgeVariant>(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "default";
    case "params-ready":
      return "secondary";
    case "params-error":
      return "destructive";
    default:
      return "outline";
  }
});

const runtimeParamsBadgeLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Loading";
    case "params-ready":
      return "Ready";
    case "params-error":
      return "Failed";
    default:
      return "Idle";
  }
});

const runtimeParamsStatusText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Preloading proving params...";
    case "params-ready":
      return "Proving params ready";
    case "params-error":
      return "Preload failed";
    default:
      return "Proving params not loaded";
  }
});

const runtimeDetailHeadline = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "Sapling runtime is unavailable";
    case "params-preloading":
      return "Proving params are downloading now";
    case "params-ready":
      return "Proving params are ready for this session";
    case "params-error":
      return "Proof generation can retry later";
    default:
      return "Proof generation can still start without preloading";
  }
});

const runtimeDetailText = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
      return "The runtime failed before key generation finished, so Sapling actions are not ready yet.";
    case "params-preloading":
      return "Shield, transfer, and unshield should not need a second proving-params download once this completes.";
    case "params-ready":
      return "Later shield, transfer, and unshield calls should skip the proving-params download step and go straight into proof generation.";
    case "params-error":
      return "Viewing and key-generation flows still work. Proof-generating actions will retry the proving-params download on first use.";
    default:
      return "Shield, transfer, and unshield will lazy-load proving params from sapling.taquito.io the first time a proof is needed.";
  }
});

const runtimeCompletionText = computed(() => {
  if (saplingRuntimeState.value.kind !== "params-ready") {
    return null;
  }

  if (saplingRuntimeState.value.elapsedMs === null) {
    return "Proof-generating actions should be faster now.";
  }

  return `Downloaded from sapling.taquito.io in ${formatElapsedMs(saplingRuntimeState.value.elapsedMs)}.`;
});

const runtimeErrorMessage = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "module-error":
    case "params-error":
      return saplingRuntimeState.value.errorMessage;
    default:
      return null;
  }
});

const preloadButtonLabel = computed(() => {
  switch (saplingRuntimeState.value.kind) {
    case "params-preloading":
      return "Downloading params...";
    case "params-ready":
      return "Proving params ready";
    default:
      return "Preload proving params";
  }
});

const preloadButtonDisabled = computed(
  () =>
    isRunning.value ||
    isReloadingSaplingSession.value ||
    saplingRuntimeState.value.kind === "params-preloading" ||
    saplingRuntimeState.value.kind === "params-ready",
);

const handlePreloadSaplingParams = async () => {
  try {
    const snapshot = await preloadSaplingProvingParams();
    syncSaplingRuntimeState(snapshot);

    toast.success("Sapling proving params ready", {
      description:
        snapshot.lastPreloadDurationMs === null
          ? "Future proof-generating actions should be faster in this session."
          : `Downloaded from sapling.taquito.io in ${formatElapsedMs(snapshot.lastPreloadDurationMs)}.`,
    });
  } catch (error) {
    const message = getSaplingErrorMessage(error);
    syncSaplingRuntimeState(getSaplingRuntimeSnapshot());

    toast.error("Failed to preload Sapling proving params", {
      description: message,
    });
  }
};

const resetSaplingPageState = () => {
  userKey.value = null;
  aliceAddress.value = "";
  transactionHistory.value = null;
  userBalance.value = null;
  saplingRuntimeState.value = { kind: "booting" };
  diagramStore.resetDiagram();
};

const handleReloadWithFreshSaplingParams = async () => {
  isReloadingSaplingSession.value = true;
  resetSaplingPageState();
  await nextTick();
  reloadWithFreshSaplingParams();
};

const markProofParamsReadyFromAction = () => {
  syncSaplingRuntimeState(markSaplingProvingParamsReady());
};

const handleProofParamError = (error: unknown) => {
  if (!isSaplingParamsError(error)) {
    return;
  }

  syncSaplingRuntimeState(markSaplingProvingParamsFailed(error));
};

onMounted(async () => {
  diagramStore.setTestDiagram("sapling");
  contractAddress.value = CONTRACT_ADDRESS;
  syncSaplingRuntimeState(getSaplingRuntimeSnapshot());

  // Automatically generate keys on load
  try {
    const [key, address] = await Promise.all([
      generateUserSpendingKey(),
      generateAliceAddress(),
    ]);

    userKey.value = key;
    aliceAddress.value = address;
    syncSaplingRuntimeState(getSaplingRuntimeSnapshot());
  } catch (error) {
    const message = getSaplingErrorMessage(error);
    console.error("Key generation error:", error);

    const runtimeSnapshot = getSaplingRuntimeSnapshot();
    if (runtimeSnapshot.moduleStatus === "failed") {
      syncSaplingRuntimeState(runtimeSnapshot);
    } else {
      saplingRuntimeState.value = {
        kind: "module-error",
        errorMessage: message,
      };
    }

    toast.error("Failed to generate Sapling keys", {
      description: message,
    });
  }
});

const handleShieldToUser = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Shielding tez (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await shieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      shieldAmount.value,
    );

    markProofParamsReadyFromAction();
    diagramStore.setOperationHash(opHash);
  } catch (error) {
    console.error("Shield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleTransferToAlice = async () => {
  if (!walletStore.getTezos || !userKey.value || !aliceAddress.value) return;

  try {
    isRunning.value = true;
    toast.info("Transferring to Alice (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await transferToAlice(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      aliceAddress.value,
      transferAmount.value,
    );

    markProofParamsReadyFromAction();
    diagramStore.setOperationHash(opHash);
  } catch (error) {
    console.error("Transfer error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleUnshieldToUser = async () => {
  if (!walletStore.getTezos || !userKey.value || !walletStore.getAddress)
    return;

  try {
    isRunning.value = true;
    toast.info("Unshielding tez (generating zero-knowledge proof)...", {
      duration: 30000,
    });

    const opHash = await unshieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      walletStore.getAddress,
      unshieldAmount.value,
    );

    markProofParamsReadyFromAction();
    diagramStore.setOperationHash(opHash);
  } catch (error) {
    console.error("Unshield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleGetTransactionHistory = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Fetching transaction history...");

    const history = await getUserTransactionHistory(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
    );

    transactionHistory.value = history;
    toast.success(`Found ${history.total} transaction(s)`);
  } catch (error) {
    console.error("Transaction history error:", error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const handleGetBalance = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Fetching balance...");

    const balance = await getUserSaplingBalance(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
    );

    userBalance.value = balance;
    toast.success("Balance retrieved");
  } catch (error) {
    console.error("Balance fetch error:", error);
    toast.error(
      `Error: ${error instanceof Error ? error.message : String(error)}`,
    );
  } finally {
    isRunning.value = false;
  }
};

const formatBalance = (balance: number): string => {
  return (balance / 1000000).toFixed(6);
};
</script>

<style scoped>
@keyframes sapling-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sapling-indeterminate {
  0% {
    transform: translateX(-100%);
  }

  100% {
    transform: translateX(300%);
  }
}

.sapling-indeterminate-bar {
  width: 35%;
  animation: sapling-indeterminate 1.2s ease-in-out infinite;
  will-change: transform;
}

.sapling-spinner {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
}

.sapling-spinner::before,
.sapling-spinner::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
}

.sapling-spinner::before {
  border: 2px solid currentColor;
  opacity: 0.2;
}

.sapling-spinner::after {
  border: 2px solid transparent;
  border-top-color: currentColor;
  border-right-color: currentColor;
  animation: sapling-spin 0.85s linear infinite;
}

.sapling-spinner-sm {
  width: 1rem;
  height: 1rem;
}

.sapling-spinner-lg {
  width: 2.5rem;
  height: 2.5rem;
}

.sapling-spinner-dot {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0.45rem;
  height: 0.45rem;
  border-radius: 9999px;
  background: currentColor;
  transform: translate(-50%, -50%);
  opacity: 0.8;
}
</style>
