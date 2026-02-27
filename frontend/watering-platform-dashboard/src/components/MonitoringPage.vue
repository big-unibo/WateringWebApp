<script setup>
import AppNavBar from "@/components/AppNavBar.vue";
import Monitoring from "@/components/Monitoring.vue";
import authService from "@/services/auth.service.js";
import { onMounted, onUnmounted, reactive, ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter()

let token = ref("");
let user = reactive({});

const checkInterval = 36000000;

onMounted(async () => {
  token.value = await authService.authHeader();

  if (token.value) {
    const result = await authService.retrieveUserSectors(token.value);
    if (!result) await router.push('/logout')

    const userData = await authService.retrieveUserData(token.value)
    user.value = { email: userData.email, name: userData.name, role: userData.role }
  }
  userTokenUpdate()
});

const userTokenUpdate = () => {
  intervalId = setInterval(async () => {
    token.value = await authService.authHeader();
    if (token.value) {
      const result = await authService.retrieveUserSectors(token.value);
      if (!result) await router.push('/logout')
      const userData = await authService.retrieveUserData(token.value)
      user.value = { email: userData.email, name: userData.name, role: userData.role }
    }
  }, checkInterval);
};

let intervalId = null;
onUnmounted(() => {
  clearInterval(intervalId);
});

</script>

<template>
  <AppNavBar :user="user" />
  <Monitoring :token="token" class="justify-content-md-center col-12"></Monitoring>
</template>

<style scoped></style>
