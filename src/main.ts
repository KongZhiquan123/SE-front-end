import { createApp } from 'vue'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import './assets/global.css'
import App from './App.vue'
import router from './router'
import {createPinia} from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import {useUserStore} from "@/stores/user";

const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

const app = createApp(App)
app.use(ElementPlus).use(router).use(pinia)
app.mount('#app')

const userStore = useUserStore()
await userStore.autoLogin()