import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import PrimeVue from "primevue/config";
import Aura from "@primevue/themes/aura";
import "./main.css";
import "primeicons/primeicons.css";

createApp(App)
  .use(PrimeVue, {
    theme: {
      preset: Aura,
      options: {
        cssLayer: {
          name: "primevue",
          order: "tailwind-base, primevue, tailwind-utilities",
        },
      },
    },
  })
  .use(router)
  .mount("#app");
