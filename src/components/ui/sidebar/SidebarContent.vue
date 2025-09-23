<script setup lang="ts">
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "vue";

const props = defineProps<{
  class?: HTMLAttributes["class"];
}>();
</script>

<template>
  <div
    data-slot="sidebar-content"
    data-sidebar="content"
    :class="
      cn(
        'flex h-full min-h-0 flex-1 flex-col gap-2 overflow-auto overscroll-contain group-data-[collapsible=icon]:overflow-hidden',
        props.class,
      )
    "
  >
    <slot />
  </div>
</template>
