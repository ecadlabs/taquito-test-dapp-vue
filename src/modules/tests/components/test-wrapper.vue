<template>
	<div class="mx-4">
		<div class="mb-4">
			<p>This is temporary content in the test.vue component that will eventually hold all the metadata about the
				test,
				such as title, example link, diagrams, etc.</p>
			<p>For now, the content below is a simple slot that expects a test component from '/tests/'</p>
		</div>

		<p>{{ testMetadata }}</p>

		<slot />
	</div>

</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { getTestById } from '@/modules/tests/tests';
import type { TestMetadata } from '@/modules/tests/test';

const route = useRoute();
const testId = computed(() => route.params.test as string);
const testMetadata = computed((): TestMetadata | undefined => getTestById(testId.value));
</script>