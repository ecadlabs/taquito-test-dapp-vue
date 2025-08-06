<template>
  <div class="flex w-full h-[calc(100vh-4.5rem)]">
    <div
      class="w-full sticky [top:4.5rem] self-start z-10 h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] overflow-hidden">
      <SidebarProvider class="!min-h-fit h-full">
        <SidebarComponent />
        <SidebarInset>
          <header class="flex my-4 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger class="-ml-1 flex md:hidden" />
            <Separator v-if="currentTestComponent" orientation="vertical" class="mr-2 md:hidden" />
            <Breadcrumb v-if="currentTestComponent">
              <BreadcrumbList>
                <BreadcrumbItem class="hidden sm:block">
                  {{ selectedTestFriendlyCategory }}
                </BreadcrumbItem>
                <BreadcrumbSeparator class="hidden sm:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{{ selectedTestFriendlyName }}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </header>
          <div ref="scrollContainer" class="flex-1 overflow-auto">
            <TestWrapper v-if="currentTestComponent">
              <component :is="currentTestComponent" v-if="currentTestComponent" />
            </TestWrapper>
            <div v-else class="w-full h-full">
              <div class="mx-auto w-fit mt-16 md:mt-32 text-center">
                <HeartCrack class="size-8 mx-auto" />
                <h1 class="font-bold text-2xl md:text-3xl">No Test Found</h1>
                <p class="text-sm md:text-base mx-8">Hmm, it looks like we don't have this test set up yet.</p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>

  </div>
</template>

<script setup lang="ts">
import TestWrapper from '@/modules/tests/components/test-wrapper.vue';
import SidebarComponent from '@/components/sidebar-component.vue';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { getTestById } from '@/modules/tests/tests';
import { computed, ref, watch, onBeforeUnmount, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { HeartCrack } from 'lucide-vue-next';
import { useDiagramStore } from '@/stores/diagramStore';

const route = useRoute();
const scrollContainer = ref<HTMLElement>();
const diagramStore = useDiagramStore();

// Watch for route changes to reset diagram when navigating between tests or away from tests
watch(() => route.params.test, (newTest, oldTest) => {
  if (scrollContainer.value) {
    scrollContainer.value.scrollTop = 0;
  }

  // Cancel current test and reset diagram when test changes or when navigating away from tests
  if (newTest !== oldTest) {
    diagramStore.cancelCurrentTest();
  }
});

// Watch for route path changes to reset diagram when leaving test routes
watch(() => route.path, (newPath, oldPath) => {
  // If navigating away from test routes (from /tests/* to something else)
  if (oldPath?.startsWith('/tests/') && !newPath.startsWith('/tests/')) {
    diagramStore.cancelCurrentTest();
  }
});

// Handle navigation away from tests
const handleNavigationAway = () => {
  diagramStore.cancelCurrentTest();
};

onMounted(() => {
  // Set up a listener for the custom navigation event
  window.addEventListener('test-navigation-away', handleNavigationAway);
});

onBeforeUnmount(() => {
  // Clean up the listener and cancel current test on component unmount
  window.removeEventListener('test-navigation-away', handleNavigationAway);
  diagramStore.cancelCurrentTest();
});

const currentTest = computed(() => {
  const testName = route.params.test as string;
  if (testName) {
    return getTestById(testName);
  }
  return null;
});

const selectedTestFriendlyCategory = computed(() => {
  if (currentTest.value) {
    return currentTest.value.category;
  }
  return '';
});

const selectedTestFriendlyName = computed(() => {
  if (currentTest.value) {
    return currentTest.value.title;
  }
  return '';
});

const currentTestComponent = computed(() => {
  if (currentTest.value) {
    return currentTest.value.component;
  }
  return null;
});
</script>