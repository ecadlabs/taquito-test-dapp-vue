<template>
  <div class="flex w-full h-[calc(100vh-4.5rem)]">
    <div
      class="w-fit sticky [top:4.5rem] self-start z-10 h-[calc(100vh-4.5rem)] max-h-[calc(100vh-4.5rem)] overflow-hidden">
      <SidebarProvider class="!min-h-fit h-full">
        <SidebarComponent @select="setBreadcrumbs($event)" />
        <SidebarInset>
          <header class="flex my-4 shrink-0 items-center gap-2 px-4">
            <SidebarTrigger class="-ml-1 flex md:hidden" />
            <Separator orientation="vertical" class="mr-2 md:hidden" />
            <Breadcrumb>
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
          <div class="flex-1 overflow-auto">
            <TestWrapper v-if="currentTestComponent">
              <component :is="currentTestComponent" v-if="currentTestComponent" />
            </TestWrapper>
            <p v-else>No test selected</p>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>

  </div>
</template>

<script setup lang="ts">
import TestWrapper from '@/modules/tests/components/test-wrapper.vue';
import SidebarComponent, { type NavigationMenuLocation } from '@/components/sidebar-component.vue';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { AvailableTests } from '@/modules/tests/tests';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const selectedTestFriendlyName = ref<string>('');
const selectedTestFriendlyCategory = ref<string>('');

const setBreadcrumbs = (params: NavigationMenuLocation) => {
  selectedTestFriendlyCategory.value = params.category.title;
  selectedTestFriendlyName.value = params.test.title;
}


const currentTestComponent = computed(() => {
  const testName = route.params.test as string;
  if (testName && (testName in AvailableTests)) {
    return AvailableTests[testName as keyof typeof AvailableTests];
  }
  return null;
});
</script>