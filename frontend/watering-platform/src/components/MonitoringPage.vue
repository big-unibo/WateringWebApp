<script setup>
import AppNavBar from "@/components/AppNavBar.vue";
import Monitoring from "@/components/Monitoring.vue";
import authService from "@/services/auth.service.js";
import {onMounted, onUnmounted, reactive} from "vue";
import {useRouter} from "vue-router";

const router = useRouter()

let token = reactive({});
let user = reactive({});

const checkInterval = 36000000;

onMounted(async () => {
  token.value = await authService.authHeader();

  if (token.value) {
    const result = await authService.retrieveUserFieldPermissions(token.value);
    if(!result) await router.push('/logout')
    user.value = {user: result.user, affiliation: result.affiliation, role: result.role}
  }
  userTokenUpdate()
});

const userTokenUpdate = () => {
  intervalId = setInterval(async () => {
    token.value = await authService.authHeader();
    if (token.value) {
      const result = await authService.retrieveUserFieldPermissions(token.value);
      if(!result) await router.push('/logout')
      user.value = result
    }
  }, checkInterval);
};
let intervalId = null;
onUnmounted(() => {
    clearInterval(intervalId);
});

</script>

<template>
  <AppNavBar :user="user"/>
  <Monitoring :user="user" :token="token" class="justify-content-md-center col-12"></Monitoring>
</template>

<style scoped>
</style>
