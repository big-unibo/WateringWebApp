import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import 'bootstrap/dist/css/bootstrap.css'
import * as bootstrap from 'bootstrap'
import router from './services/router.js'
window.bootstrap = bootstrap; //Bootstrap exposition for the library (Needed for calendar)

createApp(App).use(router).mount('#app')