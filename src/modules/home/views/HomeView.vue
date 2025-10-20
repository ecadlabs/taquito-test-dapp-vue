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
          class="from-brand/5 absolute inset-0 bg-gradient-to-br via-transparent to-blue-500/5"
        ></div>
      </div>

      <div class="relative z-10 mx-auto max-w-4xl space-y-6">
        <div class="space-y-4">
          <h1
            class="animate-fade-in-up text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            <span
              class="from-brand bg-gradient-to-r to-orange-600 bg-clip-text text-transparent"
            >
              Taquito
            </span>
            <span class="text-foreground animate-fade-in-up-delay">
              Playground</span
            >
          </h1>
          <p
            class="text-muted-foreground animate-fade-in-up-delay-2 mx-auto max-w-2xl text-lg sm:text-xl"
          >
            Learn Tezos blockchain development with interactive examples, visual
            diagrams, and hands-on testing of the popular TypeScript library.
          </p>
        </div>

        <div
          class="animate-fade-in-up-delay-3 flex flex-col gap-4 sm:flex-row sm:justify-center"
        >
          <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
            <Button
              size="lg"
              class="group bg-brand hover:bg-brand/90 hover:shadow-brand/25 px-8 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <span
                class="transition-transform duration-200 group-hover:translate-x-1"
                >Get Started</span
              >
              <ArrowRightIcon
                class="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Button>
          </RouterLink>
          <Button
            variant="outline"
            size="lg"
            @click="scrollToFeatures"
            class="group mx-auto w-fit px-8 transition-all duration-200 hover:scale-105 hover:shadow-lg sm:mx-0"
          >
            <span
              class="transition-transform duration-200 group-hover:translate-y-[-1px]"
              >Explore Features</span
            >
            <ChevronDownIcon class="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-muted/30 relative overflow-hidden border-y px-4 py-12">
      <!-- Background decoration -->
      <div
        class="from-brand/5 to-brand/5 absolute inset-0 bg-gradient-to-r via-transparent"
      ></div>

      <div class="relative mx-auto max-w-6xl">
        <div
          class="mx-auto grid w-2/3 grid-cols-1 gap-8 text-center sm:grid-cols-3"
        >
          <div
            ref="statsSection"
            class="group animate-on-scroll space-y-2"
            data-delay="0"
          >
            <div
              class="text-brand text-3xl font-bold transition-transform duration-200 group-hover:scale-110"
            >
              <AnimatedCounter :target="testCount" />
            </div>
            <div
              class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
            >
              Interactive Tests
            </div>
          </div>
          <div class="group animate-on-scroll space-y-2" data-delay="100">
            <div
              class="text-brand text-3xl font-bold transition-transform duration-200 group-hover:scale-110"
            >
              <AnimatedCounter :target="3" />
            </div>
            <div
              class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
            >
              Supported Networks
            </div>
          </div>
          <div class="group animate-on-scroll space-y-2" data-delay="200">
            <div
              class="text-brand text-3xl font-bold transition-transform duration-200 group-hover:scale-110"
            >
              <AnimatedCounter :target="100" suffix="%" />
            </div>
            <div
              class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
            >
              Free & Open Source
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="features" class="relative overflow-hidden px-4 py-16">
      <!-- Background decorations -->
      <div
        class="bg-brand/5 absolute top-0 left-1/4 h-96 w-96 rounded-full blur-3xl"
      ></div>
      <div
        class="absolute right-1/4 bottom-0 h-96 w-96 rounded-full bg-blue-500/5 blur-3xl"
      ></div>

      <div class="relative mx-auto max-w-6xl space-y-12">
        <div class="animate-on-scroll space-y-4 text-center">
          <h2 class="text-3xl font-bold sm:text-4xl">What You Can Learn</h2>
          <p class="text-muted-foreground mx-auto max-w-2xl">
            Explore comprehensive examples covering all aspects of Tezos
            development
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(category, index) in featuredCategories"
            :key="category.name"
            class="group animate-on-scroll hover:border-brand/30 hover:shadow-brand/10 cursor-pointer rounded-lg border p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl"
            :data-delay="index * 50"
          >
            <div class="flex items-start space-x-4">
              <div
                class="bg-brand/10 text-brand group-hover:bg-brand/20 rounded-lg p-3 transition-all duration-200 group-hover:scale-110"
              >
                <component :is="category.icon" class="h-6 w-6" />
              </div>
              <div class="flex-1 space-y-2">
                <h3
                  class="group-hover:text-brand font-semibold transition-colors duration-200"
                >
                  {{ category.name }}
                </h3>
                <p
                  class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
                >
                  {{ category.description }}
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="test in category.tests.slice(0, 3)"
                    :key="test"
                    class="bg-muted group-hover:bg-brand/10 group-hover:text-brand inline-flex items-center rounded-full px-2 py-1 text-xs transition-all duration-200"
                  >
                    {{ getTestTitle(test) }}
                  </span>
                  <span
                    v-if="category.tests.length > 3"
                    class="bg-muted text-muted-foreground group-hover:text-brand inline-flex items-center rounded-full px-2 py-1 text-xs transition-all duration-200"
                  >
                    +{{ category.tests.length - 3 }} more
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Quick Links -->
    <section class="bg-muted/30 relative overflow-hidden px-4 py-16">
      <!-- Floating shapes -->
      <div
        class="animate-float bg-brand/10 absolute top-1/4 right-0 h-32 w-32 rounded-full blur-xl"
      ></div>
      <div
        class="animate-float-delay absolute bottom-1/4 left-0 h-24 w-24 rounded-full bg-blue-500/10 blur-xl"
      ></div>

      <div class="relative mx-auto max-w-6xl space-y-12">
        <div class="animate-on-scroll space-y-4 text-center">
          <h2 class="text-3xl font-bold">Quick Start</h2>
          <p class="text-muted-foreground">
            Jump right into the most popular examples
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="(test, index) in quickStartTests"
            :key="test.id"
            :to="{ name: 'tests', params: { test: test.id } }"
            class="group bg-background animate-on-scroll hover:border-brand/30 hover:shadow-brand/10 rounded-lg border p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-xl"
            :data-delay="index * 50"
          >
            <div class="space-y-3">
              <h3
                class="group-hover:text-brand font-semibold transition-colors duration-200"
              >
                {{ test.title }}
              </h3>
              <p
                class="text-muted-foreground group-hover:text-foreground line-clamp-2 text-sm transition-colors duration-200"
              >
                {{ test.description }}
              </p>
              <div
                class="text-brand flex items-center text-sm transition-transform duration-200 group-hover:translate-x-2"
              >
                Try it out
                <ArrowRightIcon class="ml-1 h-3 w-3" />
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Resources & Links -->
    <section class="relative overflow-hidden px-4 py-16">
      <!-- Background effects -->
      <div
        class="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5"
      ></div>

      <div class="relative mx-auto max-w-6xl space-y-12">
        <div class="animate-on-scroll space-y-4 text-center">
          <h2 class="text-3xl font-bold">Resources & Links</h2>
          <p class="text-muted-foreground">
            Everything you need to get started with Tezos development
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Documentation -->
          <a
            href="https://taquito.io/"
            target="_blank"
            rel="noopener noreferrer"
            class="group animate-on-scroll rounded-lg border p-6 transition-all duration-250 hover:-translate-y-1 hover:border-blue-500/30 hover:shadow-xl hover:shadow-blue-500/10"
            data-delay="0"
          >
            <div class="flex items-start space-x-4">
              <div
                class="rounded-lg bg-blue-500/10 p-3 text-blue-500 transition-all duration-200 group-hover:scale-110 group-hover:bg-blue-500/20"
              >
                <BookOpenIcon class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3
                  class="font-semibold transition-colors duration-200 group-hover:text-blue-500"
                >
                  Taquito Documentation
                </h3>
                <p
                  class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
                >
                  Complete guide and API reference for Taquito
                </p>
                <div
                  class="flex items-center text-sm text-blue-500 transition-transform duration-200 group-hover:translate-x-1"
                >
                  <ExternalLinkIcon class="mr-1 h-4 w-4" />
                  taquito.io
                </div>
              </div>
            </div>
          </a>

          <!-- GitHub Repository -->
          <a
            href="https://github.com/ecadlabs/taquito-test-dapp-vue"
            target="_blank"
            rel="noopener noreferrer"
            class="group animate-on-scroll rounded-lg border p-6 transition-all duration-250 hover:-translate-y-1 hover:border-gray-500/30 hover:shadow-xl hover:shadow-gray-500/10"
            data-delay="100"
          >
            <div class="flex items-start space-x-4">
              <div
                class="rounded-lg bg-gray-500/10 p-3 text-gray-700 transition-all duration-200 group-hover:scale-110 group-hover:bg-gray-500/20 dark:text-gray-300"
              >
                <Code class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3
                  class="font-semibold transition-colors duration-200 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                >
                  Source Code
                </h3>
                <p
                  class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
                >
                  View the source code and contribute to this project
                </p>
                <div
                  class="flex items-center text-sm text-gray-700 transition-transform duration-200 group-hover:translate-x-1 dark:text-gray-300"
                >
                  <ExternalLinkIcon class="mr-1 h-4 w-4" />
                  GitHub
                </div>
              </div>
            </div>
          </a>

          <!-- Live Networks -->
          <div
            class="group animate-on-scroll rounded-lg border p-6 transition-all duration-250 hover:-translate-y-1 hover:border-green-500/30 hover:shadow-xl hover:shadow-green-500/10"
            data-delay="200"
          >
            <div class="flex items-start space-x-4">
              <div
                class="rounded-lg bg-green-500/10 p-3 text-green-500 transition-all duration-200 group-hover:scale-110 group-hover:bg-green-500/20"
              >
                <GlobeIcon class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3
                  class="font-semibold transition-colors duration-200 group-hover:text-green-500"
                >
                  Live Networks
                </h3>
                <p
                  class="text-muted-foreground group-hover:text-foreground text-sm transition-colors duration-200"
                >
                  Test on real Tezos testnets
                </p>
                <div class="space-y-1 text-sm">
                  <a
                    href="https://ghostnet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 transition-transform duration-200 hover:translate-x-1 hover:underline"
                  >
                    Ghostnet →
                  </a>
                  <a
                    href="https://seoulnet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 transition-transform duration-200 hover:translate-x-1 hover:underline"
                  >
                    Seoulnet →
                  </a>
                  <a
                    href="https://shadownet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 transition-transform duration-200 hover:translate-x-1 hover:underline"
                  >
                    Shadownet →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Call to Action -->
    <section
      class="from-brand/10 via-brand/5 relative overflow-hidden bg-gradient-to-br to-orange-500/10 px-4 py-16"
    >
      <!-- Animated background -->
      <div class="absolute inset-0">
        <div
          class="from-brand/5 absolute top-0 left-0 h-full w-full animate-pulse bg-gradient-to-r via-transparent to-orange-500/5"
        ></div>
        <div
          class="animate-float bg-brand/10 absolute -top-24 -right-24 h-48 w-48 rounded-full blur-3xl"
        ></div>
        <div
          class="animate-float-delay absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-orange-500/10 blur-3xl"
        ></div>
      </div>

      <div
        class="animate-on-scroll relative mx-auto max-w-4xl space-y-6 text-center"
      >
        <h2 class="text-3xl font-bold">Ready to Start Building?</h2>
        <p class="text-muted-foreground text-lg">
          Connect your wallet and start experimenting with Tezos blockchain
          interactions
        </p>
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
            <Button
              size="lg"
              class="group bg-brand hover:shadow-brand/25 px-8 transition-all duration-200 hover:scale-105 hover:bg-[#B8722A] hover:shadow-xl"
            >
              <span
                class="transition-transform duration-200 group-hover:translate-x-1"
                >Transferring Tez</span
              >
              <ArrowRightIcon
                class="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Button>
          </RouterLink>
          <RouterLink
            :to="{ name: 'tests', params: { test: 'counter-contract' } }"
          >
            <Button
              variant="outline"
              size="lg"
              class="group px-8 transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              <span
                class="transition-transform duration-200 group-hover:translate-x-1"
                >Smart Contracts</span
              >
              <ArrowRightIcon
                class="ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1"
              />
            </Button>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import AnimatedCounter from "@/modules/home/components/animated-counter.vue";
import {
  AvailableTests,
  getTestById,
  getTestsByCategory,
} from "@/modules/tests/tests";
import {
  ArrowRightIcon,
  BookOpenIcon,
  ChevronDownIcon,
  Code,
  CodeIcon,
  CogIcon,
  CreditCardIcon,
  ExternalLinkIcon,
  GlobeIcon,
  LayersIcon,
  ShieldCheckIcon,
  TrendingUpIcon,
} from "lucide-vue-next";
import { computed, onMounted, onUnmounted, ref } from "vue";

const testCount = computed(() => Object.keys(AvailableTests).length);

const featuredCategories = computed(() => [
  {
    name: "Core Operations",
    description:
      "Essential blockchain operations like transfers and fee estimation",
    icon: CreditCardIcon,
    tests: getTestsByCategory("Core Operations").map((t) => t.id),
  },
  {
    name: "Smart Contracts",
    description: "Interact with and deploy smart contracts on Tezos",
    icon: CogIcon,
    tests: getTestsByCategory("Smart Contracts").map((t) => t.id),
  },
  {
    name: "Staking & Consensus",
    description:
      "Participate in Tezos consensus through staking and delegation",
    icon: TrendingUpIcon,
    tests: getTestsByCategory("Staking & Consensus").map((t) => t.id),
  },
  {
    name: "Cryptography & Security",
    description: "Sign payloads and verify cryptographic operations",
    icon: ShieldCheckIcon,
    tests: getTestsByCategory("Cryptography & Security").map((t) => t.id),
  },
  {
    name: "Advanced Operations",
    description: "Complex operations like batching and global constants",
    icon: LayersIcon,
    tests: getTestsByCategory("Advanced Operations").map((t) => t.id),
  },
  {
    name: "Token Standards",
    description: "Work with FA2 tokens and TZIP standards",
    icon: CodeIcon,
    tests: getTestsByCategory("Token Standards").map((t) => t.id),
  },
]);

const quickStartTests = computed(() => {
  const testIds = [
    "transfer",
    "counter-contract",
    "estimate-fees",
    "delegation",
    "sign-payload",
    "sapling-single-state",
    "fa2-token",
  ];
  return testIds
    .map((id) => getTestById(id))
    .filter((test): test is NonNullable<typeof test> => test !== undefined);
});

const getTestTitle = (testId: string): string => {
  return getTestById(testId)?.title || testId;
};

const scrollToFeatures = () => {
  document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
};

const observer = ref<IntersectionObserver | null>(null);
// Intersection Observer for scroll animations
onMounted(() => {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
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
  background: linear-gradient(
    45deg,
    color-mix(in srgb, var(--brand) 12.5%, transparent),
    #ff6b3520
  );
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
    linear-gradient(
      color-mix(in srgb, var(--brand) 10%, transparent) 1px,
      transparent 1px
    ),
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--brand) 10%, transparent) 1px,
      transparent 1px
    );
  background-size: 50px 50px;
}

/* Animation Classes */
.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out forwards;
}

.animate-fade-in-up-delay {
  opacity: 0;
  animation: fade-in-up 0.5s ease-out 0.2s forwards;
}

.animate-fade-in-up-delay-2 {
  opacity: 0;
  animation: fade-in-up 0.5s ease-out 0.4s forwards;
}

.animate-fade-in-up-delay-3 {
  opacity: 0;
  animation: fade-in-up 0.5s ease-out 0.6s forwards;
}

.animate-float {
  animation: float 4s ease-in-out infinite;
}

.animate-float-delay {
  animation: float-delay 5s ease-in-out infinite 1s;
}

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
