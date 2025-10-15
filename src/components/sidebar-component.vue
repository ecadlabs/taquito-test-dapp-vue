<template>
  <Sidebar>
    <SidebarHeader class="block md:hidden">
      <div class="mt-2 flex items-center gap-1.5 p-2 leading-none font-medium">
        <img src="@/assets/logo.svg" alt="Taquito Logo" class="size-5" />
        <p>Taquito Playground</p>
      </div>
    </SidebarHeader>
    <SidebarContent>
      <SidebarGroup v-for="item in data.nav" :key="item.title">
        <SidebarGroupLabel>{{ item.title }}</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem
              v-for="childItem in item.items"
              :key="childItem.title"
            >
              <SidebarMenuButton
                as-child
                :is-active="isItemActive(childItem.test)"
              >
                <RouterLink
                  :to="{ name: 'tests', params: { test: childItem.test } }"
                  @click="handleNavigationClick"
                >
                  <Component :is="childItem.icon" class="size-4" />
                  <p class="truncate">{{ childItem.title }}</p>
                </RouterLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    </SidebarContent>
    <SidebarRail />
  </Sidebar>
</template>

<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { getAllCategories, getTestsByCategory } from "@/modules/tests/tests";
import { computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const { isMobile, setOpenMobile } = useSidebar();

const isItemActive = (testParam: string) => {
  return route.name === "tests" && route.params.test === testParam;
};

const handleNavigationClick = () => {
  if (isMobile.value) {
    setOpenMobile(false);
  }
};

const data = computed(() => {
  const categories = getAllCategories();

  return {
    nav: categories.map((category) => {
      const testsInCategory = getTestsByCategory(category);
      return {
        title: category.charAt(0).toUpperCase() + category.slice(1),
        items: testsInCategory.map((test) => ({
          title: test.title,
          test: test.id,
          icon: test.icon,
        })),
      };
    }),
  };
});
</script>
