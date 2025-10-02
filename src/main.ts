// organize-imports-ignore
import "./polyfills";
import { createApp } from "vue";
import "@/style.css";
import App from "@/App.vue";
import router from "@/router";
import { createPinia } from "pinia";
import * as Sentry from "@sentry/vue";

const pinia = createPinia();
const app = createApp(App);

Sentry.init({
  app,
  dsn: import.meta.env.VITE_SENTRY_DSN,
  sendDefaultPii: false,
  defaultIntegrations: false,
});

app.use(router);
app.use(pinia);

app.mount("#app");
