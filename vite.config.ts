import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import type { PluginOption } from "vite";

const ANALYZE = process.env.ANALYZE === "true";

/**
 * Group node_modules into named vendor chunks so the entry chunk stays small
 * and shared deps are cached aggressively across route navigations.
 */
function manualChunks(id: string): string | undefined {
  if (!id.includes("node_modules")) return undefined;

  if (
    id.includes("/node_modules/react/") ||
    id.includes("/node_modules/react-dom/") ||
    id.includes("/node_modules/react-router-dom/") ||
    id.includes("/node_modules/react-router/") ||
    id.includes("/node_modules/scheduler/")
  ) {
    return "react-vendor";
  }

  if (id.includes("/node_modules/@supabase/")) return "supabase";
  if (id.includes("/node_modules/@radix-ui/")) return "radix";
  if (id.includes("/node_modules/@dnd-kit/")) return "dnd-kit";
  if (id.includes("/node_modules/@tanstack/")) return "tanstack";

  if (
    id.includes("/node_modules/react-hook-form/") ||
    id.includes("/node_modules/zod/") ||
    id.includes("/node_modules/@hookform/")
  ) {
    return "forms";
  }

  if (id.includes("/node_modules/lucide-react/")) return "icons";
  if (id.includes("/node_modules/date-fns/")) return "dates";

  return "vendor";
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    ANALYZE &&
      (visualizer({
        filename: "dist/stats.html",
        gzipSize: true,
        brotliSize: true,
        template: "treemap",
        open: false,
      }) as PluginOption),
  ].filter(Boolean) as PluginOption[],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks,
      },
    },
  },
});
