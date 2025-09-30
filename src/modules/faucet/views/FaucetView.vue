<template>
  <div class="min-h-screen w-full overflow-hidden">
    <!-- Hero Section -->
    <section
      class="relative flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24"
    >
      <!-- Animated Background -->
      <div class="absolute inset-0 overflow-hidden">
        <!-- Floating Orbs -->
        <div class="floating-orb orb-1"></div>
        <div class="floating-orb orb-2"></div>
        <div class="floating-orb orb-3"></div>
        <!-- Grid Pattern -->
        <div class="bg-grid-pattern absolute inset-0 opacity-5"></div>
        <!-- Gradient Overlay -->
        <div
          class="absolute inset-0 bg-gradient-to-br from-[#D3832B]/5 via-transparent to-blue-500/5"
        />
      </div>

      <div class="relative z-10 mx-auto max-w-4xl space-y-6">
        <div class="space-y-4">
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span
              class="bg-gradient-to-r from-[#D3832B] to-orange-600 bg-clip-text text-transparent"
            >
              Taquito Faucet
            </span>
          </h1>
          <p class="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
            Free Tez for testing and development on test nets. Connect your
            wallet and request up to 10 Tez at once.
          </p>
        </div>
      </div>
    </section>

    <!-- Faucet Section -->
    <section class="relative overflow-hidden px-4 py-16">
      <!-- Background decorations -->
      <div
        class="absolute top-0 left-1/4 h-96 w-96 rounded-full bg-[#D3832B]/5 blur-3xl"
      />
      <div
        class="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl"
      />

      <div class="relative mx-auto max-w-2xl">
        <!-- Faucet Card -->
        <div
          class="animate-on-scroll bg-background/80 rounded-2xl border p-8 shadow-xl backdrop-blur-sm"
          data-delay="0"
        >
          <!-- Wallet Connection Status -->
          <div class="mb-6 space-y-4">
            <div class="flex items-center justify-between">
              <h2 class="text-2xl font-semibold">Request Tez</h2>
              <div class="flex items-center gap-2">
                <div
                  :class="[
                    'h-3 w-3 rounded-full',
                    walletStore.getAddress ? 'bg-green-500' : 'bg-red-500',
                  ]"
                />
                <span class="text-muted-foreground text-sm">
                  {{
                    walletStore.getAddress ? "Wallet Connected" : "No Wallet"
                  }}
                </span>
              </div>
            </div>

            <div v-if="walletStore.getAddress" class="space-y-2">
              <div class="text-muted-foreground text-sm">
                Address: {{ formatAddress(walletStore.getAddress) }}
              </div>
              <div class="text-muted-foreground text-sm">
                Balance: {{ formatBalance(walletStore.getBalance) }} XTZ
              </div>
            </div>
          </div>

          <!-- Balance Limit Alert -->
          <Alert
            v-if="walletStore.getAddress && hasExceededLimit"
            variant="destructive"
            class="mb-6"
          >
            <AlertTriangle class="h-4 w-4" />
            <AlertDescription>
              Your wallet balance exceeds 50 XTZ. You cannot request additional
              Tez from the faucet.
            </AlertDescription>
          </Alert>

          <!-- Faucet Form -->
          <div v-if="walletStore.getAddress" class="space-y-6">
            <!-- Amount Input -->
            <div class="space-y-2">
              <label for="amount" class="text-sm font-medium">
                Amount (XTZ)
              </label>
              <div class="relative">
                <input
                  id="amount"
                  v-model.number="requestAmount"
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.1"
                  :disabled="isLoading || hasExceededLimit"
                  class="bg-background/50 w-full rounded-lg border px-4 py-3 pr-12 text-lg backdrop-blur-sm transition-all duration-200 focus:border-[#D3832B] focus:ring-2 focus:ring-[#D3832B]/20 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Enter amount (0.1 - 10 XTZ)"
                />
                <div
                  class="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                >
                  XTZ
                </div>
              </div>
              <div class="text-muted-foreground text-xs">
                Maximum: 10 XTZ per request. Maximum balance: 50 XTZ.
              </div>
            </div>

            <!-- Request Button -->
            <Button
              @click="requestTez"
              :disabled="
                isLoading || !isValidAmount || hasExceededLimit || isCooldown
              "
              size="lg"
              class="w-full bg-[#D3832B] transition-all duration-200 hover:scale-105 hover:bg-[#B8722A] hover:shadow-lg hover:shadow-[#D3832B]/25 disabled:opacity-50 disabled:hover:scale-100"
            >
              <div v-if="isLoading" class="flex items-center gap-2">
                <div
                  class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"
                ></div>
                <span>Requesting Tez...</span>
              </div>
              <div v-else-if="isCooldown" class="flex items-center gap-2">
                <Hourglass class="spin-ease-animation h-4 w-4" />
                <span>Cooldown: {{ cooldownTimeLeft }}s</span>
              </div>
              <div v-else class="flex items-center gap-2">
                <Droplets class="h-4 w-4" />
                <span>Request {{ requestAmount }} XTZ</span>
              </div>
            </Button>

            <!-- Status Messages -->
            <div v-if="statusMessage" class="space-y-2">
              <div
                :class="[
                  'rounded-lg p-4 text-sm',
                  statusType === 'success'
                    ? 'border border-green-500/20 bg-green-500/10 text-green-600'
                    : statusType === 'error'
                      ? 'border border-red-500/20 bg-red-500/10 text-red-600'
                      : 'border border-blue-500/20 bg-blue-500/10 text-blue-600',
                ]"
              >
                <div class="flex items-center gap-2">
                  <component
                    :is="
                      statusType === 'success'
                        ? CheckCircle
                        : statusType === 'error'
                          ? XCircle
                          : Info
                    "
                    class="h-4 w-4"
                  />
                  <span>{{ statusMessage }}</span>
                </div>
                <div v-if="txHash" class="mt-2 text-xs">
                  Transaction:
                  <a
                    :href="`https://ghostnet.tzkt.io/${txHash}`"
                    target="_blank"
                    class="underline hover:no-underline"
                  >
                    {{ txHash }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- No Wallet Connected -->
          <div v-else class="space-y-4 text-center">
            <div class="bg-muted/50 rounded-lg p-6">
              <Wallet class="text-muted-foreground mx-auto h-12 w-12" />
              <h3 class="mt-4 text-lg font-semibold">Connect Your Wallet</h3>
              <p class="text-muted-foreground">
                Please connect your wallet to request Tez from the faucet.
              </p>
            </div>
          </div>
        </div>

        <!-- Info Cards -->
        <div class="mt-12 grid gap-6 md:grid-cols-2">
          <div
            class="animate-on-scroll bg-background/50 rounded-lg border p-6 backdrop-blur-sm"
            data-delay="100"
          >
            <div class="flex items-start gap-4">
              <div class="rounded-lg bg-[#D3832B]/10 p-3 text-[#D3832B]">
                <Info class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3 class="font-semibold">How It Works</h3>
                <p class="text-muted-foreground text-sm">
                  Connect your wallet, enter the amount you need (up to 10 XTZ),
                  and click request. The faucet will send Tez directly to your
                  wallet address.
                </p>
              </div>
            </div>
          </div>

          <div
            class="animate-on-scroll bg-background/50 rounded-lg border p-6 backdrop-blur-sm"
            data-delay="200"
          >
            <div class="flex items-start gap-4">
              <div class="rounded-lg bg-blue-500/10 p-3 text-blue-500">
                <Shield class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3 class="font-semibold">Limits</h3>
                <p class="text-muted-foreground text-sm">
                  Maximum 10 XTZ per request. Your total wallet balance cannot
                  exceed 50 XTZ. This faucet is for testing purposes only.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { useWalletStore } from "@/stores/walletStore";
import BigNumber from "bignumber.js";
import {
  AlertTriangle,
  CheckCircle,
  Droplets,
  Hourglass,
  Info,
  Shield,
  Wallet,
  XCircle,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";

const walletStore = useWalletStore();

const ONE_XTZ_IN_MUTEZ = 1000000;

// Reactive state
const requestAmount = ref<number>(1);
const isLoading = ref<boolean>(false);
const statusMessage = ref<string>("");
const statusType = ref<"success" | "error" | "info">("info");
const txHash = ref<string>("");
const isCooldown = ref<boolean>(false);
const cooldownTimeLeft = ref<number>(0);

// Computed properties
const isValidAmount = computed(() => {
  return requestAmount.value >= 0.1 && requestAmount.value <= 10;
});

const hasExceededLimit = computed(() => {
  if (!walletStore.getBalance) return false;
  // Convert from mutez to XTZ and check if > 50
  const balanceInXtz = walletStore.getBalance.toNumber() / ONE_XTZ_IN_MUTEZ;
  return balanceInXtz > 50;
});

// Utility functions
const formatAddress = (address: string | undefined): string => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatBalance = (balance: BigNumber | undefined): string => {
  if (!balance) return "0";
  // Convert from mutez to XTZ
  const xtz = balance.toNumber() / ONE_XTZ_IN_MUTEZ;
  return xtz.toFixed(2);
};

// Cooldown function
const startCooldown = () => {
  isCooldown.value = true;
  cooldownTimeLeft.value = 10;

  const timer = setInterval(() => {
    cooldownTimeLeft.value--;
    if (cooldownTimeLeft.value <= 0) {
      clearInterval(timer);
      isCooldown.value = false;
      cooldownTimeLeft.value = 0;
    }
  }, 1000);
};

// Faucet API functions
const requestTez = async () => {
  if (!walletStore.getAddress || !isValidAmount.value) return;

  isLoading.value = true;
  statusMessage.value = "";
  statusType.value = "info";
  txHash.value = "";

  try {
    const faucetUrl = import.meta.env.VITE_FAUCET_URL;

    if (!faucetUrl) {
      throw new Error("Faucet URL is not set");
    }

    // Since challenges and captcha are disabled, we can directly call verify
    // TODO: Change once we enable captcha and challenges
    const response = await fetch(`${faucetUrl}/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address: walletStore.getAddress,
        amount: requestAmount.value,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to request Tez");
    }

    if (data.txHash) {
      statusMessage.value = `Successfully requested ${requestAmount.value} XTZ!`;
      statusType.value = "success";
      txHash.value = data.txHash;

      // Refresh wallet balance
      await walletStore.fetchBalance();

      // Start cooldown timer
      startCooldown();
    } else {
      throw new Error("No transaction hash received");
    }
  } catch (error) {
    console.error("Faucet request error:", error);
    statusMessage.value =
      error instanceof Error ? error.message : "Failed to request Tez";
    statusType.value = "error";
  } finally {
    isLoading.value = false;
  }
};

// Intersection Observer for scroll animations
const observer = ref<IntersectionObserver | null>(null);

onMounted(() => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -30px 0px",
  };

  observer.value = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const delay = parseInt(
          entry.target.getAttribute("data-delay") || "0",
          10,
        );
        setTimeout(() => {
          entry.target.classList.add("animate-in");
        }, delay);
      }
    });
  }, observerOptions);

  document.querySelectorAll(".animate-on-scroll").forEach((el) => {
    observer.value?.observe(el);
  });
});

onUnmounted(() => {
  observer.value?.disconnect();
});
</script>

<style scoped>
/* Hero Animations */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-15px);
  }
}

@keyframes float-delay {
  0%,
  100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

/* Floating Orbs */
.floating-orb {
  position: absolute;
  background: linear-gradient(45deg, #d3832b20, #ff6b3520);
  border-radius: 50%;
  filter: blur(40px);
  animation: float 4s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  top: 10%;
  left: -10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  top: 60%;
  right: -5%;
  animation-delay: 1.5s;
}

.orb-3 {
  width: 150px;
  height: 150px;
  bottom: 20%;
  left: 60%;
  animation-delay: 3s;
}

/* Grid Pattern */
.bg-grid-pattern {
  background-image:
    linear-gradient(rgba(139, 69, 19, 0.1) 1px, transparent 1px),
    linear-gradient(90deg, rgba(139, 69, 19, 0.1) 1px, transparent 1px);
  background-size: 50px 50px;
}

/* Animation Classes */

/* Scroll Animation Base State */
.animate-on-scroll {
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

.animate-on-scroll.animate-in {
  opacity: 1;
  transform: translateY(0);
}

.spin-ease-animation {
  animation: spin-ease-animation 1.25s ease-in-out infinite;
}

@keyframes spin-ease-animation {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(180deg);
  }
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .floating-orb {
    filter: blur(20px);
  }

  .orb-1 {
    width: 200px;
    height: 200px;
  }

  .orb-2 {
    width: 150px;
    height: 150px;
  }

  .orb-3 {
    width: 100px;
    height: 100px;
  }
}
</style>
