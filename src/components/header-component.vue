<template>
  <div class="flex md:justify-between p-4">
    <RouterLink :to="{ name: 'home' }" class="font-medium leading-none flex gap-1.5 items-center p-2">
      <img src="@/assets/logo.svg" alt="Taquito Logo" class="size-5">
      <p>Taquito Playground</p>
    </RouterLink>

    <div class="mr-auto" />
    <NavigationMenu class="hidden md:block mr-4">
      <NavigationMenuList>
        <NavigationMenuItem>
          <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
            <NavigationMenuLink :class="navigationMenuTriggerStyle()">
              Examples
            </NavigationMenuLink>
          </RouterLink>
        </NavigationMenuItem>
        <NavigationMenuItem>
          <NavigationMenuLink href="https://taquito.io/docs/quick_start" :class="navigationMenuTriggerStyle()">
            Taquito Documentation
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>

    <WalletControl />

    <DropdownMenu>
      <DropdownMenuTrigger class="block md:hidden hover:cursor-pointer">
        <Menu class="size-6 ml-3" />
        <p class="sr-only">Navigation Menu Dropdown</p>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <RouterLink :to="{ name: 'tests', params: { test: firstTestId } }">
          <DropdownMenuItem class="hover:cursor-pointer">Examples</DropdownMenuItem>
        </RouterLink>
        <DropdownMenuItem @click.stop="openDocumentation" class="hover:cursor-pointer">Taquito Documentation
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </div>


</template>

<script setup lang="ts">
import WalletControl from '@/components/wallet-control.vue';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'
import { AvailableTests } from '@/modules/tests/tests';
import { computed } from 'vue';
import { Menu } from 'lucide-vue-next';

const firstTestId = computed(() => {
  return Object.values(AvailableTests)[0].id
})

const openDocumentation = () => {
  window.open('https://taquito.io/docs/quick_start')
}


</script>