<template>
  <div class="min-h-screen w-full">
    <!-- Hero Section -->
    <section
      class="flex flex-col items-center justify-center px-4 py-16 text-center sm:py-24"
    >
      <div class="mx-auto max-w-4xl space-y-6">
        <div class="space-y-4">
          <h1 class="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            <span
              class="bg-gradient-to-r from-[#D3832B] to-orange-600 bg-clip-text text-transparent"
            >
              Taquito
            </span>
            <span class="text-foreground"> Playground</span>
          </h1>
          <p class="text-muted-foreground mx-auto max-w-2xl text-lg sm:text-xl">
            Learn Tezos blockchain development with interactive examples, visual
            diagrams, and hands-on testing of the popular TypeScript library.
          </p>
        </div>

        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
            <Button size="lg" class="bg-[#D3832B] px-8 hover:bg-[#B8722A]">
              Get Started
            </Button>
          </RouterLink>
          <Button
            variant="outline"
            size="lg"
            @click="scrollToFeatures"
            class="px-8"
          >
            Explore Features
          </Button>
        </div>
      </div>
    </section>

    <!-- Stats Section -->
    <section class="bg-muted/30 border-y px-4 py-12">
      <div class="mx-auto max-w-6xl">
        <div
          class="mx-auto grid w-2/3 grid-cols-1 gap-6 text-center sm:grid-cols-3"
        >
          <div class="space-y-2">
            <div class="text-3xl font-bold text-[#D3832B]">{{ testCount }}</div>
            <div class="text-muted-foreground text-sm">Interactive Tests</div>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-[#D3832B]">3</div>
            <div class="text-muted-foreground text-sm">Supported Networks</div>
          </div>
          <div class="space-y-2">
            <div class="text-3xl font-bold text-[#D3832B]">100%</div>
            <div class="text-muted-foreground text-sm">Free & Open Source</div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Grid -->
    <section id="features" class="px-4 py-16">
      <div class="mx-auto max-w-6xl space-y-12">
        <div class="space-y-4 text-center">
          <h2 class="text-3xl font-bold sm:text-4xl">What You Can Learn</h2>
          <p class="text-muted-foreground mx-auto max-w-2xl">
            Explore comprehensive examples covering all aspects of Tezos
            development
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="category in featuredCategories"
            :key="category.name"
            class="group rounded-lg border p-6 transition-all hover:border-[#D3832B]/20 hover:shadow-lg"
          >
            <div class="flex items-start space-x-4">
              <div class="rounded-lg bg-[#D3832B]/10 p-3 text-[#D3832B]">
                <component :is="category.icon" class="h-6 w-6" />
              </div>
              <div class="flex-1 space-y-2">
                <h3 class="font-semibold">{{ category.name }}</h3>
                <p class="text-muted-foreground text-sm">
                  {{ category.description }}
                </p>
                <div class="flex flex-wrap gap-1">
                  <span
                    v-for="test in category.tests.slice(0, 3)"
                    :key="test"
                    class="bg-muted inline-flex items-center rounded-full px-2 py-1 text-xs"
                  >
                    {{ getTestTitle(test) }}
                  </span>
                  <span
                    v-if="category.tests.length > 3"
                    class="bg-muted text-muted-foreground inline-flex items-center rounded-full px-2 py-1 text-xs"
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
    <section class="bg-muted/30 px-4 py-16">
      <div class="mx-auto max-w-6xl space-y-12">
        <div class="space-y-4 text-center">
          <h2 class="text-3xl font-bold">Quick Start</h2>
          <p class="text-muted-foreground">
            Jump right into the most popular examples
          </p>
        </div>

        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <RouterLink
            v-for="test in quickStartTests"
            :key="test.id"
            :to="{ name: 'tests', params: { test: test.id } }"
            class="group bg-background rounded-lg border p-6 transition-all hover:border-[#D3832B]/20 hover:shadow-lg"
          >
            <div class="space-y-3">
              <h3
                class="font-semibold transition-colors group-hover:text-[#D3832B]"
              >
                {{ test.title }}
              </h3>
              <p class="text-muted-foreground line-clamp-2 text-sm">
                {{ test.description }}
              </p>
              <div class="flex items-center text-sm text-[#D3832B]">
                Try it out →
              </div>
            </div>
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Resources & Links -->
    <section class="px-4 py-16">
      <div class="mx-auto max-w-6xl space-y-12">
        <div class="space-y-4 text-center">
          <h2 class="text-3xl font-bold">Resources & Links</h2>
          <p class="text-muted-foreground">
            Everything you need to get started with Tezos development
          </p>
        </div>

        <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <!-- Documentation -->
          <a
            href="https://taquito.io/docs/"
            target="_blank"
            rel="noopener noreferrer"
            class="group rounded-lg border p-6 transition-all hover:border-[#D3832B]/20 hover:shadow-lg"
          >
            <div class="flex items-start space-x-4">
              <div class="rounded-lg bg-blue-500/10 p-3 text-blue-500">
                <BookOpenIcon class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3
                  class="font-semibold transition-colors group-hover:text-[#D3832B]"
                >
                  Taquito Documentation
                </h3>
                <p class="text-muted-foreground text-sm">
                  Complete guide and API reference for Taquito
                </p>
                <div class="flex items-center text-sm text-blue-500">
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
            class="group rounded-lg border p-6 transition-all hover:border-[#D3832B]/20 hover:shadow-lg"
          >
            <div class="flex items-start space-x-4">
              <div
                class="rounded-lg bg-gray-500/10 p-3 text-gray-700 dark:text-gray-300"
              >
                <Code class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3
                  class="font-semibold transition-colors group-hover:text-[#D3832B]"
                >
                  Source Code
                </h3>
                <p class="text-muted-foreground text-sm">
                  View the source code and contribute to this project
                </p>
                <div
                  class="flex items-center text-sm text-gray-700 dark:text-gray-300"
                >
                  <ExternalLinkIcon class="mr-1 h-4 w-4" />
                  GitHub
                </div>
              </div>
            </div>
          </a>

          <!-- Live Networks -->
          <div class="group rounded-lg border p-6">
            <div class="flex items-start space-x-4">
              <div class="rounded-lg bg-green-500/10 p-3 text-green-500">
                <GlobeIcon class="h-6 w-6" />
              </div>
              <div class="space-y-2">
                <h3 class="font-semibold">Live Networks</h3>
                <p class="text-muted-foreground text-sm">
                  Test on real Tezos testnets
                </p>
                <div class="space-y-1 text-sm">
                  <a
                    href="https://ghostnet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 hover:underline"
                  >
                    Ghostnet →
                  </a>
                  <a
                    href="https://seoulnet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 hover:underline"
                  >
                    Seoulnet →
                  </a>
                  <a
                    href="https://shadownet.dapp.taquito.io/"
                    target="_blank"
                    class="block text-green-500 hover:underline"
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
    <section class="bg-[#D3832B]/5 px-4 py-16">
      <div class="mx-auto max-w-4xl space-y-6 text-center">
        <h2 class="text-3xl font-bold">Ready to Start Building?</h2>
        <p class="text-muted-foreground text-lg">
          Connect your wallet and start experimenting with Tezos blockchain
          interactions
        </p>
        <div class="flex flex-col gap-4 sm:flex-row sm:justify-center">
          <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
            <Button size="lg" class="bg-[#D3832B] px-8 hover:bg-[#B8722A]">
              Transferring Tez
            </Button>
          </RouterLink>
          <RouterLink
            :to="{ name: 'tests', params: { test: 'counter-contract' } }"
          >
            <Button variant="outline" size="lg" class="px-8">
              Smart Contracts
            </Button>
          </RouterLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
import {
  AvailableTests,
  getTestById,
  getTestsByCategory,
} from "@/modules/tests/tests";
import {
  BookOpenIcon,
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
import { computed } from "vue";

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
</script>
