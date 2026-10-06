<script setup>
import { RouterView, RouterLink } from 'vue-router';
import AppHeader from './components/AppHeader.vue';
</script>

<template>
  <div id="app" class=".mode">

    <AppHeader />


    <!-- PAGE CONTENT -->
    <main class="main-content">
      <router-view />
    </main>

  </div>
</template>

<style></style>