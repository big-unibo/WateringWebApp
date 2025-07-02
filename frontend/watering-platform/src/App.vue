<script setup>
import authService from "@/services/auth.service.js"
import { useRouter } from 'vue-router';
const router = useRouter()
const authUser = import.meta.env.VITE_DEMO_USER
const authPass = import.meta.env.VITE_DEMO_PASSWORD

authService.login({authUser, authPass})
const token = authService.authHeader()

router.push("/")

</script>

<template>
  <div class="app-body">
    <router-view />
  </div>
</template>

<style scoped>
@media (min-width: 1024px) {

  .app-body{
    display: flex;
    place-items: center;
  }

  header {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  body {
    display: flex;
    place-items: center;
    padding-right: calc(var(--section-gap) / 2);
  }

  .logo {
    margin: 0 2rem 0 0;
  }

  header .wrapper {
    display: flex;
    place-items: flex-start;
    flex-wrap: wrap;
  }
}
</style>
