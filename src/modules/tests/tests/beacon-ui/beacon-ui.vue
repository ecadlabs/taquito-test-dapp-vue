<template>
  <div class="w-full space-y-6">
    <!-- Controls Grid -->
    <div class="grid gap-4 md:grid-cols-2">
      <!-- Theme / ColorMode Card -->
      <div class="bg-card space-y-4 rounded-lg border p-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <SunMoon class="text-muted-foreground size-4" aria-hidden="true" />
            <h3 class="text-sm font-semibold">Theme &amp; Beacon Color Mode</h3>
          </div>
          <Badge variant="outline" class="font-mono text-xs">
            {{ activeColorMode }}
          </Badge>
        </div>

        <p class="text-muted-foreground text-xs">
          Switches both the Playground UI and Beacon's shadow-DOM pairing modals
          and toasts via <code class="font-mono">setColorMode()</code>.
        </p>

        <div
          class="flex flex-wrap gap-2"
          role="group"
          aria-label="Select theme mode"
        >
          <Button
            v-for="option in themeOptions"
            :key="option.value"
            size="sm"
            :variant="
              settingsStore.settings.themeMode === option.value
                ? 'default'
                : 'outline'
            "
            :aria-pressed="settingsStore.settings.themeMode === option.value"
            @click="settingsStore.setThemeMode(option.value)"
          >
            <component
              :is="option.icon"
              class="mr-1.5 size-4"
              aria-hidden="true"
            />
            {{ option.label }}
          </Button>
        </div>
      </div>

      <!-- Language & RTL Card -->
      <div class="bg-card space-y-4 rounded-lg border p-4">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <Languages
              class="text-muted-foreground size-4"
              aria-hidden="true"
            />
            <h3 class="text-sm font-semibold">Beacon i18n &amp; RTL</h3>
          </div>
          <div class="flex items-center gap-1.5">
            <Badge variant="secondary" class="font-mono text-xs">
              {{ resolvedLang }}
            </Badge>
            <Badge variant="outline" class="font-mono text-xs uppercase">
              {{ resolvedDirection }}
            </Badge>
          </div>
        </div>

        <div class="grid gap-3 sm:grid-cols-2">
          <div class="space-y-1.5">
            <Label :for="localeSelectId" class="text-xs">Language</Label>
            <Select v-model="settingsStore.settings.beaconLocale">
              <SelectTrigger :id="localeSelectId" class="w-full">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="auto">
                    Auto (Browser{{
                      browserLocale ? `: ${browserLocale}` : ""
                    }})
                  </SelectItem>
                  <SelectItem
                    v-for="locale in localeOptions"
                    :key="locale.locale"
                    :value="locale.locale"
                  >
                    {{ locale.name }} ({{ locale.locale
                    }}{{ locale.direction === "rtl" ? ", RTL" : "" }})
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label :for="directionSelectId" class="text-xs"
              >Text Direction</Label
            >
            <Select v-model="settingsStore.settings.beaconDirection">
              <SelectTrigger :id="directionSelectId" class="w-full">
                <SelectValue placeholder="Select direction" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="auto">Auto (from locale)</SelectItem>
                  <SelectItem value="ltr">LTR (Left-to-Right)</SelectItem>
                  <SelectItem value="rtl">RTL (Right-to-Left)</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="space-y-1.5">
          <div class="flex items-center justify-between gap-2">
            <Label :for="customTitleInputId" class="text-xs">
              Custom Pairing Heading Override
              <code class="text-muted-foreground font-mono"
                >(dapp.choosePreferredWallet)</code
              >
            </Label>
            <Button
              v-if="customTitleDraft"
              size="sm"
              variant="ghost"
              class="h-6 px-2 text-xs"
              aria-label="Reset custom pairing heading"
              @click="resetCustomTitle"
            >
              Reset
            </Button>
          </div>
          <Input
            :id="customTitleInputId"
            v-model="customTitleDraft"
            type="text"
            placeholder="Leave blank to use active locale catalog"
            class="text-xs"
            @blur="commitCustomTitle"
            @keydown.enter="commitCustomTitle"
          />
        </div>

        <p class="text-muted-foreground text-xs">
          Locale catalog:
          <strong class="text-foreground">{{ activeLocaleMeta.name }}</strong>
          ({{ activeLocaleMeta.locale }}) · status:
          <code class="font-mono">{{ activeLocaleMeta.status }}</code>
        </p>
      </div>
    </div>

    <!-- Live Localized Preview -->
    <div class="bg-card space-y-4 rounded-lg border p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold">
            Live Localized Beacon Copy Preview
          </h3>
          <p class="text-muted-foreground text-xs">
            Rendered directly from
            <code class="font-mono">getBeaconMessages()</code> and
            <code class="font-mono">getBeaconErrorCopy()</code> with
            <code class="font-mono">dir="{{ resolvedDirection }}"</code>.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <Button size="sm" :disabled="connecting" @click="openLiveBeaconModal">
            <Loader2
              v-if="connecting"
              class="mr-1.5 size-4 animate-spin"
              aria-hidden="true"
            />
            <Wallet v-else class="mr-1.5 size-4" aria-hidden="true" />
            {{
              isBeaconConnected
                ? "Disconnect & Reopen Beacon Modal"
                : hasNonBeaconWallet
                  ? "Switch to Beacon & Open Modal"
                  : "Open Beacon Pairing Modal"
            }}
          </Button>
          <Button size="sm" variant="outline" @click="inspector.open()">
            <Radar class="mr-1.5 size-4" aria-hidden="true" />
            Open Beacon Inspector
          </Button>
        </div>
      </div>

      <div
        v-if="walletStore.getWallet"
        class="text-foreground flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs"
        role="note"
      >
        <TriangleAlert
          class="mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400"
          aria-hidden="true"
        />
        <p v-if="isBeaconConnected">
          Currently connected with
          <strong>{{ walletStore.getWalletName || "Beacon" }}</strong
          >. Reopening the pairing modal disconnects the active session;
          cancelling leaves you disconnected.
        </p>
        <p v-else>
          Currently connected with
          <strong>{{
            walletStore.getWalletName || walletStore.getProvider
          }}</strong
          >. Opening the Beacon modal will disconnect that session and switch to
          Beacon.
        </p>
      </div>

      <div class="bg-muted/40 grid gap-4 rounded-md border p-4 md:grid-cols-2">
        <div class="space-y-2 text-xs">
          <p class="text-muted-foreground font-mono text-[11px] uppercase">
            Pairing &amp; Toast Copy
          </p>
          <div
            :dir="resolvedDirection"
            :lang="resolvedLang"
            class="bg-background space-y-2 rounded-md border p-3"
          >
            <p class="text-sm font-semibold">
              {{ messages.dapp.choosePreferredWallet }}
            </p>
            <p class="text-muted-foreground">
              {{ sampleRequestSent }}
            </p>
            <p class="text-muted-foreground">
              {{ sampleAwaitingConfirmation }}
            </p>
            <div class="flex flex-wrap gap-1.5 pt-1">
              <Badge variant="secondary">{{
                messages.ui.walletTypes.desktopApp
              }}</Badge>
              <Badge variant="secondary">{{
                messages.ui.walletTypes.browserExtension
              }}</Badge>
              <Badge variant="secondary">{{
                messages.ui.walletTypes.mobileApp
              }}</Badge>
              <Badge variant="secondary">{{
                messages.ui.walletTypes.webApp
              }}</Badge>
            </div>
          </div>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="text-muted-foreground font-mono text-[11px] uppercase">
              Localized Error Copy
            </p>
            <Select v-model="selectedErrorType">
              <SelectTrigger
                aria-label="Preview error type"
                class="h-7 w-48 text-xs"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem
                    v-for="errType in previewErrorTypes"
                    :key="errType"
                    :value="errType"
                  >
                    {{ errType }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div
            :dir="resolvedDirection"
            :lang="resolvedLang"
            class="bg-background space-y-1.5 rounded-md border p-3"
          >
            <p class="font-semibold">{{ selectedErrorCopy.title }}</p>
            <p class="text-muted-foreground leading-relaxed">
              {{ selectedErrorCopy.description }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- BeaconWallet Runtime Observability -->
    <div class="bg-card space-y-4 rounded-lg border p-4">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="space-y-0.5">
          <h3 class="text-sm font-semibold">
            BeaconWallet Runtime Observability
          </h3>
          <p class="text-muted-foreground text-xs">
            Snapshot from first-class
            <code class="font-mono">BeaconWallet</code> methods (<code
              class="font-mono"
              >getWalletInfo</code
            >, <code class="font-mono">getConnectionInfo</code>,
            <code class="font-mono">getAccounts</code>,
            <code class="font-mono">getPeers</code>,
            <code class="font-mono">getPendingRequests</code>).
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          :disabled="!isBeaconConnected || refreshingSnapshot"
          @click="refreshObservability"
        >
          <RefreshCw
            class="mr-1.5 size-3.5"
            :class="{ 'animate-spin': refreshingSnapshot }"
            aria-hidden="true"
          />
          Refresh
        </Button>
      </div>

      <div
        v-if="!isBeaconConnected"
        class="bg-muted/40 text-muted-foreground rounded-md border p-4 text-xs"
      >
        Connect a wallet with <strong>Beacon</strong> to inspect
        <code class="font-mono">WalletInfo</code>,
        <code class="font-mono">ConnectionInfo</code>, peers, and pending
        requests.
      </div>

      <div v-else class="grid gap-3 text-xs md:grid-cols-3">
        <div class="bg-muted/40 space-y-1 rounded-md border p-3">
          <p class="text-muted-foreground font-mono text-[11px] uppercase">
            Wallet Info
          </p>
          <p class="font-medium">{{ walletInfo?.name ?? "Unknown" }}</p>
          <p class="text-muted-foreground font-mono">
            type: {{ walletInfo?.type ?? "n/a" }}
          </p>
          <p class="text-muted-foreground font-mono">
            accounts: {{ accountCount }} · peers: {{ peerCount }}
          </p>
        </div>

        <div class="bg-muted/40 space-y-1 rounded-md border p-3">
          <p class="text-muted-foreground font-mono text-[11px] uppercase">
            Connection Info
          </p>
          <p class="font-mono font-medium">
            {{ connectionInfo?.transport ?? "none" }}
          </p>
          <p class="text-muted-foreground font-mono">
            status: {{ connectionInfo?.status ?? "n/a" }} · health:
            {{ connectionInfo?.health ?? "n/a" }}
          </p>
          <p
            v-if="connectionInfo?.relayServer"
            class="text-muted-foreground truncate font-mono"
            :title="connectionInfo.relayServer"
          >
            relay: {{ connectionInfo.relayServer }}
          </p>
        </div>

        <div class="bg-muted/40 space-y-1 rounded-md border p-3">
          <p class="text-muted-foreground font-mono text-[11px] uppercase">
            Pending Requests
          </p>
          <p class="font-medium">
            {{ inspector.pendingRequests.length }} in flight
          </p>
          <p class="text-muted-foreground">
            Updates automatically via the Beacon inspector collector; use
            Refresh for wallet and transport metadata.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getBeaconLocaleOptions,
  resolveColorMode,
  type ThemeMode,
} from "@/lib/beaconAppearance";
import { formatBeaconError } from "@/lib/walletEvents";
import { useBeaconInspectorStore } from "@/stores/inspectorStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useWalletStore } from "@/stores/walletStore";
import {
  BeaconWallet,
  ColorMode,
  getColorMode,
  subscribeColorMode,
  type ConnectionInfo,
  type WalletInfo,
} from "@taquito/beacon-wallet";
import {
  BeaconErrorType,
  detectBrowserLocale,
  getBeaconDirection,
  getBeaconErrorCopy,
  getBeaconMessages,
  interpolateBeaconMessage,
  resolveBeaconLang,
  subscribeBeaconI18n,
  type BeaconLocaleMessages,
  type BeaconResolvedDirection,
} from "@taquito/beacon-wallet/types";
import { usePreferredDark, watchDebounced } from "@vueuse/core";
import {
  Languages,
  Loader2,
  Monitor,
  Moon,
  Radar,
  RefreshCw,
  Sun,
  SunMoon,
  TriangleAlert,
  Wallet,
} from "lucide-vue-next";
import {
  computed,
  onMounted,
  onUnmounted,
  ref,
  shallowRef,
  useId,
  watch,
} from "vue";
import { toast } from "vue-sonner";

const settingsStore = useSettingsStore();
const walletStore = useWalletStore();
const inspector = useBeaconInspectorStore();
const prefersDark = usePreferredDark();

const localeSelectId = useId();
const directionSelectId = useId();
const customTitleInputId = useId();

const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

const localeOptions = getBeaconLocaleOptions();
const browserLocale = detectBrowserLocale();

const previewErrorTypes: readonly BeaconErrorType[] = [
  BeaconErrorType.ABORTED_ERROR,
  BeaconErrorType.PEER_UNREACHABLE,
  BeaconErrorType.TRANSACTION_INVALID_ERROR,
  BeaconErrorType.NOT_GRANTED_ERROR,
  BeaconErrorType.NETWORK_NOT_SUPPORTED,
  BeaconErrorType.BROADCAST_ERROR,
  BeaconErrorType.SIGNATURE_TYPE_NOT_SUPPORTED,
];

const selectedErrorType = ref<BeaconErrorType>(BeaconErrorType.ABORTED_ERROR);
const activeColorMode = ref<ColorMode>(
  resolveColorMode(settingsStore.getThemeMode, prefersDark.value),
);
const resolvedLang = ref<string>(resolveBeaconLang());
const resolvedDirection = ref<BeaconResolvedDirection>(getBeaconDirection());
const messages = shallowRef<BeaconLocaleMessages>(getBeaconMessages());

// Debounce custom heading edits so typing does not trigger Beacon appearance
// sync and localStorage writes on every keystroke.
const customTitleDraft = ref<string>(settingsStore.getBeaconCustomTitle);

const commitCustomTitle = () => {
  if (customTitleDraft.value !== settingsStore.getBeaconCustomTitle) {
    settingsStore.setBeaconCustomTitle(customTitleDraft.value);
  }
};

const resetCustomTitle = () => {
  customTitleDraft.value = "";
  settingsStore.setBeaconCustomTitle("");
};

watchDebounced(
  customTitleDraft,
  (nextTitle) => {
    if (nextTitle !== settingsStore.getBeaconCustomTitle) {
      settingsStore.setBeaconCustomTitle(nextTitle);
    }
  },
  { debounce: 300 },
);

watch(
  () => settingsStore.getBeaconCustomTitle,
  (storedTitle) => {
    if (storedTitle !== customTitleDraft.value) {
      customTitleDraft.value = storedTitle;
    }
  },
);

const connecting = ref(false);
const refreshingSnapshot = ref(false);
const walletInfo = ref<WalletInfo | undefined>();
const connectionInfo = ref<ConnectionInfo | undefined>();
const accountCount = ref(0);
const peerCount = ref(0);

const isBeaconConnected = computed(
  () => walletStore.getWallet instanceof BeaconWallet,
);
const hasNonBeaconWallet = computed(
  () =>
    walletStore.getWallet !== undefined &&
    !(walletStore.getWallet instanceof BeaconWallet),
);

const activeLocaleMeta = computed(() => messages.value.meta);

const selectedErrorCopy = computed(() => {
  // Depend on the replaced catalog object so custom overrides and sub-tag
  // updates re-evaluate even when the resolved language tag is unchanged.
  void messages.value;
  return getBeaconErrorCopy(selectedErrorType.value);
});

const sampleRequestSent = computed(() =>
  interpolateBeaconMessage(messages.value.dapp.requestSent, {
    wallet: walletInfo.value?.name ?? "Kukai",
  }),
);

const sampleAwaitingConfirmation = computed(() =>
  interpolateBeaconMessage(messages.value.dapp.awaitingConfirmation, {
    wallet: walletInfo.value?.name ?? "Kukai",
  }),
);

let syncSeq = 0;

const syncReadouts = async () => {
  const seq = ++syncSeq;
  resolvedLang.value = resolveBeaconLang();
  resolvedDirection.value = getBeaconDirection();
  messages.value = getBeaconMessages();
  const mode = await getColorMode();
  if (seq === syncSeq) {
    activeColorMode.value = mode;
  }
};

let snapshotSeq = 0;

const refreshObservability = async () => {
  const seq = ++snapshotSeq;
  const wallet = walletStore.getWallet;
  if (!(wallet instanceof BeaconWallet)) {
    walletInfo.value = undefined;
    connectionInfo.value = undefined;
    accountCount.value = 0;
    peerCount.value = 0;
    refreshingSnapshot.value = false;
    return;
  }

  refreshingSnapshot.value = true;
  try {
    const [info, conn, accounts, peers, mode] = await Promise.all([
      wallet.getWalletInfo(),
      wallet.getConnectionInfo(),
      wallet.getAccounts(),
      wallet.getPeers(),
      wallet.getColorMode(),
    ]);
    if (seq !== snapshotSeq) {
      return;
    }
    walletInfo.value = info;
    connectionInfo.value = conn;
    accountCount.value = accounts.length;
    peerCount.value = peers.length;
    activeColorMode.value = mode;
  } catch (error) {
    if (seq === snapshotSeq) {
      toast.error("Failed to read Beacon wallet state", {
        description: formatBeaconError(error),
      });
    }
  } finally {
    if (seq === snapshotSeq) {
      refreshingSnapshot.value = false;
    }
  }
};

const openLiveBeaconModal = async () => {
  connecting.value = true;
  try {
    if (walletStore.getWallet) {
      await walletStore.disconnectWallet();
    }
    await walletStore.initializeWallet("beacon");
    toast.success("Beacon wallet connected");
  } catch (error) {
    toast.error("Beacon connection cancelled or failed", {
      description: formatBeaconError(error),
    });
  } finally {
    connecting.value = false;
  }
};

let unsubscribeI18n: (() => void) | undefined;
let unsubscribeColor: (() => void) | undefined;

onMounted(() => {
  void syncReadouts();
  void refreshObservability();

  unsubscribeI18n = subscribeBeaconI18n(() => {
    void syncReadouts();
  });
  unsubscribeColor = subscribeColorMode(() => {
    void syncReadouts();
  });
});

onUnmounted(() => {
  unsubscribeI18n?.();
  unsubscribeColor?.();
});

watch(
  () => walletStore.getWallet,
  () => {
    void refreshObservability();
  },
);
</script>
