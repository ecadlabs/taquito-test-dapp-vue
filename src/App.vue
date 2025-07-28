<template>
  <div id="app">
    <HeaderComponent />
    <router-view />
  </div>
</template>

<script setup lang="ts">
import HeaderComponent from '@/components/header-component.vue';
</script>