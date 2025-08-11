import { createRouter, createWebHistory } from "vue-router";
import HomeView from "@/modules/home/views/HomeView.vue";
import TestsView from "@/modules/tests/views/TestsView.vue";

const routes = [
  {
    path: "/",
    name: "home",
    component: HomeView,
  },
  {
    path: "/tests/:test?",
    name: "tests",
    component: TestsView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard to reset diagram when leaving test routes
router.beforeEach((to, from, next) => {
  // If navigating away from a test route (from /tests/* to something else)
  if (from.path.startsWith("/tests/") && !to.path.startsWith("/tests/")) {
    // Dispatch a custom event that the diagram store can listen to
    window.dispatchEvent(new CustomEvent("test-navigation-away"));
  }
  next();
});

export default router;
