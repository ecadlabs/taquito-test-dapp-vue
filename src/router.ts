import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("@/modules/home/views/HomeView.vue"),
  },
  {
    path: "/tests/:test?",
    name: "tests",
    component: () => import("@/modules/tests/views/TestsView.vue"),
  },
  {
    path: "/faucet",
    name: "faucet",
    component: () => import("@/modules/faucet/views/FaucetView.vue"),
  },
  {
    path: "/documentation",
    name: "documentation",
    component: () => import("@/modules/home/views/HomeView.vue"),
    beforeEnter() {
      window.open(
        "https://taquito.io/docs/quick_start",
        "_blank",
        "noopener,noreferrer",
      );
      return false;
    },
    meta: { external: true },
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
