<template>
  <Toaster />

  <div id="app">
    <HeaderComponent />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import HeaderComponent from '@/components/header-component.vue';

import { Toaster } from '@/components/ui/sonner'
import 'vue-sonner/style.css'
</script>