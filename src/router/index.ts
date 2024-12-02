import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import FormView from "../views/FormView.vue";

const routes: Array<RouteRecordRaw> = [
  {
    path: "/",
    name: "form",
    component: FormView,
  },
  {
    path: "/:pathMatch(.*)*",
    name: "notFound",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
