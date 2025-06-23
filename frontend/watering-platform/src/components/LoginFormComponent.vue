<script setup>
import {ref} from 'vue'
import authService from "@/services/auth.service.js";
import { useRouter } from 'vue-router';
const router = useRouter()

const props = defineProps({
  username: String,
  password: String,
  jwt: String
})

let username = ref(props.username)
let password = ref(props.password)
let loginError = ref(false)

const handleLogin = async () => {

  try {
    const authUser = username.value;
    const authPass = password.value;
    await authService.login({authUser, authPass});
    const token = await authService.authHeader();
    if(token) {
        await router.push("/")
    } else {
      throw Error('Error on load user token')
    }
  } catch (error) {
    console.error(error);
    authService.logout();
    loginError.value = true
    console.info(`Login error ${loginError}`)
  }

}

</script>

<template>
  <div id="loginContainer">
    <form id="formLogin" class="form-signin" @submit.prevent="handleLogin">
      <img class="mb-4" src="../assets/images/big2018.png" alt="" width="100"><br>
      <h4 class="h4 mb-3 font-weight-normal">Inserisci le credenziali</h4>
      <input v-model="username" class="form-control input-username" placeholder="Username" required autofocus/>
      <input  type="password" v-model="password" class="form-control input-password" placeholder="Password" required/>
      <div v-if="loginError" id="alertCredentials" class="alert alert-danger" role="alert">Email e/o Password errate.</div>
      <button class="btn btn-lg btn-primary btn-block" type="submit">Login</button>
    </form>
  </div>
</template>

<style scoped>
#loginContainer {
  height: 100%;
  position: relative;
}

.input-username{
  margin-bottom: 10%;
}

.input-password{
  margin-bottom: 10%;
}

button {
  width: 100%;
}

#loginContainer {
  text-align: center;
  display: -ms-flexbox;
  display: flex;
  -ms-flex-align: center;
  align-items: center;
  padding-top: 40px;
  padding-bottom: 40px;
}

.form-signin {
  width: 100%;
  max-width: 330px;
  padding: 15px;
  margin: auto;
}

.form-signin .form-control {
  position: relative;
  box-sizing: border-box;
  height: auto;
  padding: 10px;
  font-size: 16px;
}
.form-signin .form-control:focus {
  z-index: 1;
}

</style>