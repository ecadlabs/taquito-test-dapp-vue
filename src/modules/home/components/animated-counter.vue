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
const duration = 1500; // 1.5 seconds

onMounted(() => {
  const startTime = Date.now();
  const animate = () => {
    const currentTime = Date.now();
    const progress = Math.min((currentTime - startTime) / duration, 1);

    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    count.value = Math.floor(props.target * easeOutQuart);

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      count.value = props.target;
    }
  };

  setTimeout(() => requestAnimationFrame(animate), 300);
});

const displayValue = computed(() => `${count.value}${props.suffix ?? ""}`);
</script>
