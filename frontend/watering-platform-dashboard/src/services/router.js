import {createRouter, createWebHistory} from "vue-router";

import LoginPage from "@/components/LoginPage.vue";
import MonitoringPage from "@/components/MonitoringPage.vue";

const routes = [
    {
        path: "/",
        name: "Watering",
        component: MonitoringPage,
        props: true
    },
    {
        path: "/login",
        name: "Login",
        component: LoginPage,
    },
    {
        path: "/logout",
        name: "Logout",
        component: LoginPage,
    }
];

const router = createRouter({
    history: createWebHistory('/projects/watering/'),
    routes
});

export default router;