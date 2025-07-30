<template>
  <div class="flex justify-between p-4">
    <RouterLink :to="{ name: 'home' }" class="font-medium leading-none flex gap-1.5 items-center p-2">
      <img src="@/assets/logo.svg" alt="Taquito Logo" class="size-5">
      <p>Taquito Playground</p>
    </RouterLink>

    <NavigationMenu class="[&_div.absolute]:left-auto [&_div.absolute]:right-0">
      <NavigationMenuList>
        <NavigationMenuItem>
          <RouterLink :to="{ name: 'tests' }">
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
  </div>


</template>

<script setup lang="ts">
import WalletControl from '@/components/wallet-control.vue';

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'


</script>