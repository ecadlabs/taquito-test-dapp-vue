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
          complete due to zero-knowledge proof generation. If proving params are
          not loaded yet, the first proof-generating action will download them
          from <code>sapling.taquito.io</code> first. The page may pause briefly
          while the WebAssembly prover runs.
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
              transfer, and unshield lazy-load the proving-params bundle on
              first use unless you preload it here.
            </CardDescription>
          </div>
          <CardAction>
            <div class="flex flex-wrap items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                :disabled="
                  isRunning ||
                  isReloadingSaplingSession ||
                  saplingRuntimeState.kind === 'params-preloading'
                "
                @click="handleReloadWithFreshSaplingParams"
                data-testid="sapling-fresh-reload-button"
              >
                <RotateCcw class="size-4" />
                Reset Sapling Session
              </Button>
            </div>
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
            class="space-y-3 rounded-xl border border-sky-200 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950/50"
          >
            <div class="flex items-center gap-4">
              <div class="relative text-sky-700 dark:text-sky-300">
                <span
                  class="sapling-spinner sapling-spinner-lg"
                  aria-hidden="true"
                ></span>
                <span class="sapling-spinner-dot" aria-hidden="true"></span>
              </div>
              <div class="space-y-1">
                <div class="text-sm font-medium text-sky-950 dark:text-sky-100">
                  Downloading proving params
                </div>
                <div class="text-sm text-sky-900 dark:text-sky-200">
                  Pulling the Sapling proving bundle from
                  <code
                    class="rounded bg-white/80 px-1 py-0.5 text-xs dark:bg-sky-900/80"
                    >sapling.taquito.io</code
                  >
                  so proof-generating actions can run.
                </div>
              </div>
            </div>
            <div class="bg-muted h-2 overflow-hidden rounded-full">
              <div class="sapling-indeterminate-bar bg-primary h-full" />
            </div>
            <div class="text-xs text-sky-900/80 dark:text-sky-300/80">
              The runtime does not expose byte-level progress, so this bar stays
              indeterminate.
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Sapling Addresses -->
      <Card>
        <CardHeader>
          <div class="space-y-1">
            <CardTitle class="flex items-center gap-2">
              <Key class="size-4" />
              Sapling Addresses
            </CardTitle>
            <CardDescription>
              Keys are persisted in session storage for this tab so route
              navigation does not orphan shielded funds. You can generate a new
              keypair or restore an existing mnemonic at any time.
            </CardDescription>
          </div>
          <CardAction>
            <div class="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                :disabled="isRunning || !userKey"
                @click="showMnemonicImport = !showMnemonicImport"
              >
                <Key class="size-4" />
                {{ showMnemonicImport ? "Cancel Import" : "Import Mnemonic" }}
              </Button>
              <Button
                variant="outline"
                size="sm"
                :disabled="isRunning || !userKey"
                @click="handleRegenerateKeys"
                data-testid="sapling-regenerate-keys-button"
              >
                <RotateCcw class="size-4" />
                New Keys
              </Button>
            </div>
          </CardAction>
        </CardHeader>
        <CardContent class="space-y-4">
          <div
            v-if="showMnemonicImport"
            class="bg-muted/40 space-y-3 rounded-lg border p-3"
          >
            <Label class="text-xs font-medium">
              Restore Your Sapling Spending Key (BIP39 Mnemonic)
            </Label>
            <div class="flex gap-2">
              <Input
                v-model="mnemonicInput"
                type="text"
                placeholder="Enter 12 or 24 recovery words..."
                :disabled="isRunning"
              />
              <Button
                size="sm"
                :disabled="isRunning || !mnemonicInput.trim()"
                @click="handleImportMnemonic"
              >
                Restore
              </Button>
            </div>
          </div>

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
                >Alice's Sapling Address (Session Recipient):</Label
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

          <div
            v-if="!userKey || !aliceAddress"
            class="text-muted-foreground text-sm"
          >
            Generating keys...
          </div>
        </CardContent>
      </Card>

      <!-- Step 1: Shield Tez -->
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
            Move tez from your connected public account into the Sapling pool to
            create a private note.
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
              !walletConnected ||
              !contractAddress ||
              !userKey ||
              isRunning ||
              !isValidAmount(shieldAmount)
            "
            class="w-full"
            data-testid="sapling-shield-button"
          >
            <Lock class="mr-2 h-4 w-4" />
            Shield Tez
          </Button>
        </CardContent>
      </Card>

      <!-- Step 2: Transfer to Alice -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <ArrowRightLeft class="size-4" />
            Transfer to Alice
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 2</Badge>
          </CardAction>
          <CardDescription>
            Spend your private note to Alice's Sapling address inside the
            shielded pool. Any remaining value from the spent note is returned
            to you as a new change note.
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
              isRunning ||
              !isValidAmount(transferAmount)
            "
            class="w-full"
            data-testid="sapling-transfer-button"
          >
            <ArrowRightLeft class="mr-2 h-4 w-4" />
            Transfer to Alice
          </Button>
        </CardContent>
      </Card>

      <!-- Step 3: Unshield to User's Public Address -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Unlock class="size-4" />
            Unshield to Your Public Address
          </CardTitle>
          <CardAction>
            <Badge variant="outline">Step 3</Badge>
          </CardAction>
          <CardDescription>
            Exit the Sapling pool by sending funds back to your connected public
            address
            <code v-if="walletStore.getAddress" class="text-xs">{{
              walletStore.getAddress
            }}</code
            >.
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
              !walletConnected ||
              !contractAddress ||
              !userKey ||
              isRunning ||
              !isValidAmount(unshieldAmount)
            "
            class="w-full"
            data-testid="sapling-unshield-button"
          >
            <Unlock class="mr-2 h-4 w-4" />
            Unshield Tez
          </Button>
        </CardContent>
      </Card>

      <!-- Inspect Shielded Pool Balances -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <Wallet class="size-4" />
            Shielded Pool Balances
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">Viewing Key</Badge>
          </CardAction>
          <CardDescription>
            Decrypt unspent notes for your viewing key and Alice's viewing key
            without generating a proof. Automatically updates after operations
            once opened.
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
          <div v-if="userBalance !== null" class="grid gap-3 md:grid-cols-2">
            <div class="bg-background rounded-lg border p-3">
              <div class="text-muted-foreground text-sm font-medium">
                Your Unspent Balance:
              </div>
              <div
                class="text-foreground text-2xl font-bold"
                data-testid="sapling-user-balance"
              >
                {{ formatBalance(userBalance) }} ꜩ
              </div>
            </div>
            <div
              v-if="aliceBalance !== null"
              class="bg-background rounded-lg border p-3"
            >
              <div class="text-muted-foreground text-sm font-medium">
                Alice's Unspent Balance:
              </div>
              <div
                class="text-foreground text-2xl font-bold"
                data-testid="sapling-alice-balance"
              >
                {{ formatBalance(aliceBalance) }} ꜩ
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <!-- Inspect Transaction History -->
      <Card>
        <CardHeader>
          <CardTitle class="flex items-center gap-2">
            <History class="size-4" />
            Transaction History
          </CardTitle>
          <CardAction>
            <Badge variant="secondary">Viewing Key</Badge>
          </CardAction>
          <CardDescription>
            Inspect decrypted incoming notes, outgoing private transfers, and
            change notes for your viewing key without generating a proof.
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
            <div
              class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-950/50"
            >
              <div
                class="mb-1 text-sm font-medium text-blue-900 dark:text-blue-100"
              >
                How Sapling UTXO notes work
              </div>
              <div class="text-xs text-blue-800 dark:text-blue-200">
                Sapling uses an unspent-note (UTXO) model. When you spend a note
                (for example, transferring 1 ꜩ from a 3 ꜩ note), the original 3
                ꜩ note is marked <strong>Spent</strong>, an
                <strong>Outgoing</strong> note of 1 ꜩ is sent to Alice, and a
                new <strong>Change</strong> note of 2 ꜩ is returned to your
                address. Unshielding exits to a public <code>tz</code> address,
                so inside the pool it marks your input note spent and records
                any remaining change note.
              </div>
            </div>

            <!-- Transaction Count -->
            <div class="bg-background rounded-lg border p-3">
              <div class="text-muted-foreground mb-1 text-sm font-medium">
                Total Notes &amp; Transfers:
              </div>
              <div
                class="text-foreground text-2xl font-bold"
                data-testid="sapling-history-total"
              >
                {{ transactionHistory.total }}
              </div>
            </div>

            <!-- Transaction List -->
            <div class="space-y-1.5" data-testid="sapling-history-list">
              <div
                v-for="(tx, index) in transactionHistory.transactions"
                :key="`tx-${index}`"
                :class="[
                  'flex items-center justify-between rounded-lg border px-3 py-2 text-sm',
                  tx.type === 'incoming'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40'
                    : 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950/40',
                ]"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span
                    :class="[
                      'font-medium',
                      tx.type === 'incoming'
                        ? 'text-green-800 dark:text-green-200'
                        : 'text-red-800 dark:text-red-200',
                    ]"
                  >
                    {{ tx.type === "incoming" ? "+" : "-" }}
                    {{ formatBalance(tx.amount) }} ꜩ
                  </span>
                  <span
                    v-if="tx.memo"
                    class="text-xs text-gray-600 dark:text-gray-300"
                  >
                    ({{ tx.memo }})
                  </span>
                  <Badge
                    v-if="tx.isChange"
                    variant="outline"
                    class="text-[10px]"
                  >
                    Change
                  </Badge>
                  <Badge
                    v-if="tx.type === 'incoming'"
                    :variant="tx.isSpent ? 'outline' : 'secondary'"
                    class="text-[10px]"
                  >
                    {{ tx.isSpent ? "Spent" : "Unspent" }}
                  </Badge>
                </div>
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  {{ tx.type === "incoming" ? "In" : "Out" }}
                </span>
              </div>
            </div>
          </div>
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
  generateAliceSpendingKey,
  generateUserSpendingKey,
  getSaplingErrorMessage,
  getSaplingRuntimeSnapshot,
  getUserSaplingBalance,
  getUserTransactionHistory,
  isSaplingParamsError,
  markSaplingProvingParamsFailed,
  preloadSaplingProvingParams,
  reloadWithFreshSaplingParams,
  setSaplingStoreHooks,
  shieldToUser,
  subscribeSaplingRuntimeSnapshot,
  transferToAlice,
  unshieldToUser,
  type SaplingRuntimeSnapshot,
  type SaplingTransactionHistory,
  type UserSaplingKey,
} from "@/modules/tests/tests/sapling/sapling";
import { getContractAddress } from "@/networks/network-registry";
import { useDiagramStore } from "@/stores/diagramStore";
import { useSettingsStore } from "@/stores/settingsStore";
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
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from "vue";
import { toast } from "vue-sonner";

const diagramStore = useDiagramStore();
const settingsStore = useSettingsStore();
const walletStore = useWalletStore();
const networkId =
  import.meta.env.VITE_NETWORK_NAME || import.meta.env.VITE_NETWORK_TYPE;

const walletConnected = computed(() => !!walletStore.getAddress);
const isRunning = ref(false);
const isBootingKeys = ref(true);
const isReloadingSaplingSession = ref(false);
const showMnemonicImport = ref(false);
const mnemonicInput = ref("");

type BadgeVariant = NonNullable<BadgeVariants["variant"]>;
type SaplingRuntimeUiState =
  | { kind: "booting" }
  | { kind: "module-error"; errorMessage: string }
  | { kind: "params-idle" }
  | { kind: "params-preloading" }
  | { kind: "params-ready"; elapsedMs: number | null }
  | { kind: "params-error"; errorMessage: string };

const contractAddress = ref("");
// Use shallowRef to preserve private class members on InMemorySpendingKey
const userKey = shallowRef<UserSaplingKey | null>(null);
const aliceKey = shallowRef<UserSaplingKey | null>(null);
const aliceAddress = computed(() => aliceKey.value?.address ?? "");
const saplingRuntimeState = ref<SaplingRuntimeUiState>({ kind: "booting" });

// Amounts (in tez)
const shieldAmount = ref(3);
const transferAmount = ref(1);
const unshieldAmount = ref(1);

// Results
const transactionHistory = ref<SaplingTransactionHistory | null>(null);
const userBalance = ref<number | null>(null);
const aliceBalance = ref<number | null>(null);

// Get contract address from config
const CONTRACT_ADDRESS = getContractAddress("sapling", networkId) ?? "";

let unsubscribeRuntimeSnapshot: (() => void) | undefined;

const isValidAmount = (value: number): boolean =>
  typeof value === "number" && Number.isFinite(value) && value > 0;

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
        snapshot.moduleStatus === "ready" && !isBootingKeys.value
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
      return "Shield, transfer, and unshield will not need a second proving-params download once this completes.";
    case "params-ready":
      return "Shield, transfer, and unshield calls can skip the proving-params download step and go straight into proof generation.";
    case "params-error":
      return "Viewing and key-generation flows still work. Proof-generating actions will retry the proving-params download on next use.";
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
  aliceKey.value = null;
  transactionHistory.value = null;
  userBalance.value = null;
  aliceBalance.value = null;
  saplingRuntimeState.value = { kind: "booting" };
  diagramStore.resetDiagram();
};

const handleReloadWithFreshSaplingParams = async () => {
  isReloadingSaplingSession.value = true;
  resetSaplingPageState();
  await nextTick();
  reloadWithFreshSaplingParams();
};

const handleRegenerateKeys = async () => {
  try {
    isRunning.value = true;
    const [newUserKey, newAliceKey] = await Promise.all([
      generateUserSpendingKey({ forceNew: true }),
      generateAliceSpendingKey({ forceNew: true }),
    ]);
    userKey.value = newUserKey;
    aliceKey.value = newAliceKey;
    transactionHistory.value = null;
    userBalance.value = null;
    aliceBalance.value = null;
    toast.success("Generated new Sapling session keys");
  } catch (error) {
    toast.error(`Failed to generate keys: ${getSaplingErrorMessage(error)}`);
  } finally {
    isRunning.value = false;
  }
};

const handleImportMnemonic = async () => {
  if (!mnemonicInput.value.trim()) return;

  try {
    isRunning.value = true;
    const restoredKey = await generateUserSpendingKey({
      mnemonic: mnemonicInput.value,
    });
    userKey.value = restoredKey;
    transactionHistory.value = null;
    userBalance.value = null;
    mnemonicInput.value = "";
    showMnemonicImport.value = false;
    toast.success("Restored Sapling spending key");
  } catch (error) {
    toast.error(`Failed to restore mnemonic: ${getSaplingErrorMessage(error)}`);
  } finally {
    isRunning.value = false;
  }
};

const handleProofParamError = (error: unknown) => {
  if (!isSaplingParamsError(error)) {
    return;
  }

  syncSaplingRuntimeState(markSaplingProvingParamsFailed(error));
};

const refreshOpenedInspectionPanels = async () => {
  if (!walletStore.getTezos || !userKey.value || !contractAddress.value) {
    return;
  }

  const tasks: Promise<void>[] = [];

  if (userBalance.value !== null) {
    tasks.push(
      (async () => {
        const [uBal, aBal] = await Promise.all([
          getUserSaplingBalance(
            walletStore.getTezos!,
            contractAddress.value,
            userKey.value!,
          ),
          aliceKey.value
            ? getUserSaplingBalance(
                walletStore.getTezos!,
                contractAddress.value,
                aliceKey.value,
              )
            : Promise.resolve(null),
        ]);
        userBalance.value = uBal;
        aliceBalance.value = aBal;
      })(),
    );
  }

  if (transactionHistory.value !== null) {
    tasks.push(
      (async () => {
        transactionHistory.value = await getUserTransactionHistory(
          walletStore.getTezos!,
          contractAddress.value,
          userKey.value!,
        );
      })(),
    );
  }

  if (tasks.length > 0) {
    await Promise.allSettled(tasks);
  }
};

onMounted(async () => {
  diagramStore.setTestDiagram("sapling");
  contractAddress.value = CONTRACT_ADDRESS;

  setSaplingStoreHooks({
    setTestDiagram: (testId, key) => diagramStore.setTestDiagram(testId, key),
    setProgress: (step) => diagramStore.setProgress(step),
    setFeeEstimate: (estimate) => diagramStore.setFeeEstimate(estimate),
    setOperationHash: (opHash) => diagramStore.setOperationHash(opHash),
    setCompleted: () => diagramStore.setCompleted(),
    getConfirmationCount: () => settingsStore.getConfirmationCount,
  });

  unsubscribeRuntimeSnapshot = subscribeSaplingRuntimeSnapshot(
    syncSaplingRuntimeState,
  );

  // Automatically generate or restore session keys on load
  try {
    const [uKey, aKey] = await Promise.all([
      generateUserSpendingKey(),
      generateAliceSpendingKey(),
    ]);

    userKey.value = uKey;
    aliceKey.value = aKey;
    isBootingKeys.value = false;
    syncSaplingRuntimeState(getSaplingRuntimeSnapshot());
  } catch (error) {
    isBootingKeys.value = false;
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

onBeforeUnmount(() => {
  unsubscribeRuntimeSnapshot?.();
  setSaplingStoreHooks(undefined);
});

const handleShieldToUser = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !isValidAmount(shieldAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    loadingToastId = toast.info(
      "Shielding tez (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await shieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      shieldAmount.value,
    );

    toast.success(`Shielded ${shieldAmount.value} ꜩ into the Sapling pool`);
    await refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Shield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
    isRunning.value = false;
  }
};

const handleTransferToAlice = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !aliceAddress.value ||
    !isValidAmount(transferAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    loadingToastId = toast.info(
      "Transferring to Alice (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await transferToAlice(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      aliceAddress.value,
      transferAmount.value,
    );

    toast.success(`Transferred ${transferAmount.value} ꜩ privately to Alice`);
    await refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Transfer error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
    isRunning.value = false;
  }
};

const handleUnshieldToUser = async () => {
  if (
    !walletStore.getTezos ||
    !userKey.value ||
    !walletStore.getAddress ||
    !isValidAmount(unshieldAmount.value)
  )
    return;

  let loadingToastId: string | number | undefined;
  try {
    isRunning.value = true;
    loadingToastId = toast.info(
      "Unshielding tez (generating zero-knowledge proof)...",
      {
        duration: 60000,
      },
    );

    await unshieldToUser(
      walletStore.getTezos,
      contractAddress.value,
      userKey.value,
      walletStore.getAddress,
      unshieldAmount.value,
    );

    toast.success(
      `Unshielded ${unshieldAmount.value} ꜩ to ${walletStore.getAddress}`,
    );
    await refreshOpenedInspectionPanels();
  } catch (error) {
    console.error("Unshield error:", error);
    handleProofParamError(error);
    diagramStore.setErrorMessage(error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    if (loadingToastId !== undefined) {
      toast.dismiss(loadingToastId);
    }
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
    toast.success(`Found ${history.total} note(s) and transfer(s)`);
  } catch (error) {
    console.error("Transaction history error:", error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
  } finally {
    isRunning.value = false;
  }
};

const handleGetBalance = async () => {
  if (!walletStore.getTezos || !userKey.value) return;

  try {
    isRunning.value = true;
    toast.info("Fetching shielded balances...");

    const [uBalance, aBalance] = await Promise.all([
      getUserSaplingBalance(
        walletStore.getTezos,
        contractAddress.value,
        userKey.value,
      ),
      aliceKey.value
        ? getUserSaplingBalance(
            walletStore.getTezos,
            contractAddress.value,
            aliceKey.value,
          )
        : Promise.resolve(null),
    ]);

    userBalance.value = uBalance;
    aliceBalance.value = aBalance;
    toast.success("Shielded balances retrieved");
  } catch (error) {
    console.error("Balance fetch error:", error);
    toast.error(`Error: ${getSaplingErrorMessage(error)}`);
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
