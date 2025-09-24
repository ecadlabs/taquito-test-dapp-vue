<template>
  <div class="mt-24 flex w-full flex-col items-center space-y-4">
    <h1 class="text-4xl font-bold tracking-wide">Taquito Playground</h1>
    <h2 class="w-1/2 text-center font-medium">
      Learn the ropes or test Taquito, the popular TypeScript library that makes
      developing your Tezos blockchain apps faster and more fun.
    </h2>
    <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
      <Button class="mt-6 bg-[#D3832B]">Get Started</Button>
    </RouterLink>
  </div>
</template>

<script setup lang="ts">
import { Button } from "@/components/ui/button";
</script>
