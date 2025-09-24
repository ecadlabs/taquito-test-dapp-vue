<template>
  <div class="mr-4 mb-4 ml-4 md:mr-8">
    <div v-if="testMetadata" class="space-y-8">
      <!-- Header Section -->
      <div class="space-y-1">
        <div class="flex items-center gap-1">
          <BookOpenText class="mt-0.5 size-6 shrink-0" />
          <h1 class="text-2xl font-bold tracking-tight">
            {{ testMetadata.title }}
          </h1>
          <template v-if="testMetadata.contractApi">
            <Badge variant="warning" class="mt-0.5 ml-1 text-xs">
              Contract API
            </Badge>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info class="text-muted-foreground mt-0.5 h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent class="w-48">
                  <p>
                    This test uses the Taquito contract API. It will only work
                    with the programmatic testing wallet (manually entered
                    private key).
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </template>
        </div>
        <p
          class="text-muted-foreground w-full text-base whitespace-pre-line xl:w-2/3 2xl:w-1/2"
        >
          {{ testMetadata.description }}
        </p>
      </div>

      <div class="grid w-full grid-cols-1 gap-4 lg:grid-cols-3">
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
              <li
                v-for="(step, index) in testMetadata.setup"
                :key="index"
                class="flex items-start gap-2"
              >
                <span
                  class="bg-primary text-primary-foreground mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full text-xs font-medium"
                >
                  {{ index + 1 }}
                </span>
                <span class="text-sm">{{ step }}</span>
              </li>
            </ul>
          </CardContent>
        </Card>
        <!-- Related Tests -->
        <Card class="w-full">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Link class="h-5 w-5" />
              Related Tests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div v-if="testMetadata.relatedTests.length > 0">
              <router-link
                v-for="relatedTestId in testMetadata.relatedTests"
                :key="relatedTestId"
                :to="`/tests/${relatedTestId}`"
                class="hover:bg-muted flex items-center gap-2 rounded-md p-2 transition-colors"
              >
                <ArrowRight class="text-muted-foreground h-4 w-4" />
                <span class="text-sm font-medium">{{
                  getTestTitle(relatedTestId)
                }}</span>
              </router-link>
            </div>
            <p v-else class="text-muted-foreground text-sm">
              No related tests available
            </p>
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
              <div v-if="testMetadata.documentation.contract" class="space-y-3">
                <div
                  v-for="contract in testMetadata.documentation.contract"
                  :key="contract.name"
                  class="flex items-center gap-2"
                >
                  <FileCode class="text-muted-foreground h-4 w-4" />
                  <a
                    :href="contract.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary text-sm hover:underline"
                  >
                    {{ contract.name }}
                  </a>
                </div>
              </div>
              <div
                v-if="testMetadata.documentation.script"
                class="flex items-center gap-2"
              >
                <FileText class="text-muted-foreground h-4 w-4" />
                <a
                  :href="testMetadata.documentation.script"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-sm hover:underline"
                >
                  Script Source
                </a>
              </div>
              <div
                v-if="testMetadata.documentation.taqutioDocumentation"
                class="flex items-center gap-2"
              >
                <BookOpenText class="text-muted-foreground h-4 w-4" />
                <a
                  :href="testMetadata.documentation.taqutioDocumentation"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-sm hover:underline"
                >
                  Taquito Documentation
                </a>
              </div>
              <div
                v-if="testMetadata.documentation.tezosDocumentation"
                class="flex items-center gap-2"
              >
                <BookOpenText class="text-muted-foreground h-4 w-4" />
                <a
                  :href="testMetadata.documentation.tezosDocumentation"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-primary text-sm hover:underline"
                >
                  Tezos Documentation
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <!-- Middle Section: Actual Test Content -->
      <div class="border-t pt-8">
        <slot />
      </div>

      <!-- Bottom Section: Operational Flow -->
      <div class="space-y-6 border-t pt-8">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import TestDiagram from "@/components/test-diagram.vue";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { TestMetadata } from "@/modules/tests/test";
import { getTestById } from "@/modules/tests/tests";
import { useDiagramStore } from "@/stores/diagramStore";
import {
  ArrowRight,
  BookOpenText,
  Code,
  FileCode,
  FileText,
  Info,
  Link,
  Settings,
  Workflow,
} from "lucide-vue-next";
import { computed, onUnmounted } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const testId = computed(() => route.params.test as string);
const testMetadata = computed((): TestMetadata | undefined =>
  getTestById(testId.value),
);

const diagramStore = useDiagramStore();

const getTestTitle = (testId: string): string => {
  const test = getTestById(testId);
  return test?.title || testId;
};

onUnmounted(() => {
  // Cancel current test when leaving test
  diagramStore.cancelCurrentTest();
});
</script>
