<template>
  <div class="w-full flex flex-col items-center space-y-4 mt-24">
    <h1 class="font-bold text-4xl tracking-wide">Taquito Playground</h1>
    <h2 class="font-medium w-1/2 text-center">
      Learn the ropes or test Taquito, the popular TypeScript library that makes developing your Tezos blockchain apps
      faster and more fun.
    </h2>
    <RouterLink :to="{ name: 'tests', params: { test: 'transfer' } }">
      <Button class="bg-[#D3832B] mt-6">Get Started</Button>
    </RouterLink>

  </div>
</template>

<script setup lang="ts">
import { Button } from '@/components/ui/button';
</script>