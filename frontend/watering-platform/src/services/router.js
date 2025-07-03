import {createRouter, createWebHistory} from "vue-router";

import LoginPage from "@/components/LoginPage.vue";
import MonitoringPage from "@/components/MonitoringPage.vue";

const routes = [
    {
        path: "/",
        name: "Watering",
        component: MonitoringPage,
        props: true
    }
];

const router = createRouter({
    history: createWebHistory('/projects/smarter/'),
    routes
});

export default router;