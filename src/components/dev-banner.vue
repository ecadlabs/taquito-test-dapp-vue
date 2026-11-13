<template>
  <div
    v-if="notices.length > 0"
    role="status"
    aria-label="Development configuration"
    class="border-b border-amber-300 bg-amber-100 px-4 py-1 text-center text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100"
  >
    <p v-for="notice in notices" :key="notice.id" class="break-all">
      {{ notice.text }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { getDevNotices } from "@/lib/devConfig";

// KUKAI_URL_OVERRIDE is only defined under `vite serve` with the override set.
const notices = getDevNotices({
  dev: import.meta.env.DEV,
  kukaiUrlOverride: import.meta.env.KUKAI_URL_OVERRIDE,
  reownProjectId: import.meta.env.VITE_REOWN_PROJECT_ID,
});
</script>
