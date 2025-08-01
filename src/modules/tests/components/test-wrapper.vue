<template>
	<div class="ml-4 mr-4 mb-4 md:mr-8">
		<div v-if="testMetadata" class="space-y-8">
			<!-- Header Section -->
			<div class="space-y-1">
				<div class="flex items-center gap-1">
					<BookOpen class="size-6 mt-0.5 shrink-0" />
					<h1 class="text-2xl font-bold tracking-tight">{{ testMetadata.title }}</h1>
				</div>
				<p class="text-base text-muted-foreground">{{ testMetadata.description }}</p>
			</div>

			<!-- Top Section: Learning Goals, Prerequisites, Setup -->
			<div class="grid gap-4 grid-cols-1 lg:grid-cols-3 w-full">
				<!-- Learning Goals -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Target class="h-5 w-5" />
							Learning Goals
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul class="space-y-2">
							<li v-for="goal in testMetadata.learningGoals" :key="goal" class="flex items-start gap-2">
								<CheckCircle class="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
								<span class="text-sm">{{ goal }}</span>
							</li>
						</ul>
					</CardContent>
				</Card>

				<!-- Prerequisites -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<ClipboardList class="h-5 w-5" />
							Prerequisites
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul class="space-y-2">
							<li v-for="prereq in testMetadata.prerequisites" :key="prereq"
								class="flex items-start gap-2">
								<Circle class="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
								<span class="text-sm">{{ prereq }}</span>
							</li>
						</ul>
					</CardContent>
				</Card>

				<!-- Setup -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Settings class="h-5 w-5" />
							Setup
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ul class="space-y-2">
							<li v-for="(step, index) in testMetadata.setup" :key="index" class="flex items-start gap-2">
								<span
									class="flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium flex-shrink-0 mt-0.5">
									{{ index + 1 }}
								</span>
								<span class="text-sm">{{ step }}</span>
							</li>
						</ul>
					</CardContent>
				</Card>
			</div>

			<!-- Middle Section: Actual Test Content -->
			<div class="border-t pt-8">
				<slot />
			</div>

			<!-- Bottom Section: Operational Flow, Related Tests, Sources -->
			<div class="border-t pt-8 space-y-6">
				<!-- Operational Flow -->
				<Card>
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Workflow class="h-5 w-5" />
							Operational Flow
						</CardTitle>
					</CardHeader>
					<CardContent>
						<TestDiagram />
					</CardContent>
				</Card>

				<div class="grid gap-6 grid-cols-1 lg:grid-cols-2 w-full">
					<!-- Related Tests -->
					<Card class="w-full">
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Link class="h-5 w-5" />
								Related Tests
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div v-if="testMetadata.relatedTests.length > 0" class="space-y-2">
								<router-link v-for="relatedTestId in testMetadata.relatedTests" :key="relatedTestId"
									:to="`/tests/${relatedTestId}`"
									class="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
									<ArrowRight class="h-4 w-4 text-muted-foreground" />
									<span class="text-sm font-medium">{{ getTestTitle(relatedTestId) }}</span>
								</router-link>
							</div>
							<p v-else class="text-sm text-muted-foreground">No related tests available</p>
						</CardContent>
					</Card>

					<!-- Source Code & Documentation -->
					<Card class="w-full">
						<CardHeader>
							<CardTitle class="flex items-center gap-2">
								<Code class="h-5 w-5" />
								Source & Documentation
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div class="space-y-3">
								<div v-if="testMetadata.sourceCode.contract" class="flex items-center gap-2">
									<FileCode class="h-4 w-4 text-muted-foreground" />
									<a :href="testMetadata.sourceCode.contract" target="_blank"
										rel="noopener noreferrer" class="text-sm text-primary hover:underline">
										Contract Source
									</a>
								</div>
								<div v-if="testMetadata.sourceCode.script" class="flex items-center gap-2">
									<FileText class="h-4 w-4 text-muted-foreground" />
									<a :href="testMetadata.sourceCode.script" target="_blank" rel="noopener noreferrer"
										class="text-sm text-primary hover:underline">
										Script Source
									</a>
								</div>
								<div v-if="testMetadata.sourceCode.documentation" class="flex items-center gap-2">
									<BookOpen class="h-4 w-4 text-muted-foreground" />
									<a :href="testMetadata.sourceCode.documentation" target="_blank"
										rel="noopener noreferrer" class="text-sm text-primary hover:underline">
										Documentation
									</a>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { getTestById } from '@/modules/tests/tests';
import type { TestMetadata } from '@/modules/tests/test';
import TestDiagram from '@/components/test-diagram.vue';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDiagramStore } from '@/stores/diagramStore';
import { onUnmounted } from 'vue';
import {
	BookOpen,
	Target,
	CheckCircle,
	ClipboardList,
	Circle,
	Settings,
	Link,
	ArrowRight,
	Code,
	FileCode,
	FileText,
	Workflow
} from 'lucide-vue-next';

const route = useRoute();
const testId = computed(() => route.params.test as string);
const testMetadata = computed((): TestMetadata | undefined => getTestById(testId.value));

const diagramStore = useDiagramStore();

const getTestTitle = (testId: string): string => {
	const test = getTestById(testId);
	return test?.title || testId;
};

onUnmounted(() => {
	// Reset diagram when leaving test
	diagramStore.resetDiagram();
});
</script>