<script setup>
import { RouterView, RouterLink , useRoute} from 'vue-router';
import AppHeader from './components/AppHeader.vue';
const route = useRoute();
</script>

<template>
  <div id="app" class=".mode">

    <AppHeader v-if="route.path !== '/login'"/>


    <!-- PAGE CONTENT -->
    <main class="main-content">
      <router-view />
    </main>

  </div>
</template>

<style></style>