<template>
  <span>{{ displayValue }}</span>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

interface Props {
  target: number;
  suffix?: string;
}

const props = defineProps<Props>();

const count = ref(0);
const ANIMATION_DURATION_MS = 1500;
const ANIMATION_DELAY_MS = 300;

onMounted(() => {
  const startTime = performance.now();
  const animate = () => {
    const currentTime = performance.now();
    const progress = Math.min(
      (currentTime - startTime) / ANIMATION_DURATION_MS,
      1,
    );

    const easeOutQuart = 1 - Math.pow(1 - progress, 2.15);
    count.value = Math.floor(props.target * easeOutQuart);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      count.value = props.target;
    }
  };

  setTimeout(() => requestAnimationFrame(animate), ANIMATION_DELAY_MS);
});

const displayValue = computed(() => `${count.value}${props.suffix ?? ""}`);
</script>
