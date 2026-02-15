import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  esbuild: {
    drop: ["console", "debugger"],
  },
  plugins: [react(), tailwindcss()],
  base: "/mvhmdle-remake-project/",
});
