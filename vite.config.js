import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return undefined;
          }

          if (id.includes("recharts")) {
            return "charts";
          }

          if (id.includes("framer-motion")) {
            return "motion";
          }

          if (id.includes("@supabase")) {
            return "supabase";
          }

          if (id.includes("lucide-react")) {
            return "icons";
          }

          return "vendor";
        },
      },
    },
  },
});
