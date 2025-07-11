<script setup>
import authService from "@/services/auth.service.js"
import { useRouter } from 'vue-router';
import {registerChartComponents} from 'smarter-charts'

const router = useRouter()

registerChartComponents()
const token = authService.authHeader()

if(token)
  router.push("/")
else router.push("/login")

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
