<template>
  <div class="flex w-full">
    <div class="w-1/4 border">
      Sidebar
    </div>
    <TestComponent v-if="currentTestComponent">
      <component :is="currentTestComponent" v-if="currentTestComponent" />
    </TestComponent>
    <p v-else>No test selected</p>
  </div>
</template>

<script setup lang="ts">
import TestComponent from '@/modules/tests/components/test.vue';
import { AvailableTests } from '@/modules/tests/tests';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const currentTestComponent = computed(() => {
  const testName = route.params.test as string;
  if (testName && (testName in AvailableTests)) {
    return AvailableTests[testName as keyof typeof AvailableTests];
  }
  return null;
});
</script>