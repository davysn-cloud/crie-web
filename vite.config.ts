import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
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
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      manifestFilename: "manifest.webmanifest",
      includeAssets: ["favicon.svg", "icon-192.svg", "icon-512.svg"],
      devOptions: {
        enabled: false,
      },
      manifest: {
        name: "Crie - Aprovacao",
        short_name: "Crie Aprova",
        description:
          "Portal de aprovacao de conteudo para clientes de agencias de marketing.",
        theme_color: "#EEF0A8",
        background_color: "#F3F1EB",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        lang: "pt-BR",
        icons: [
          {
            src: "/icon-192.svg",
            sizes: "192x192",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
          {
            src: "/icon-512.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/auth/, /^\/api/, /^\/functions\//],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        runtimeCaching: [
          // Hashed JS/CSS assets — content-addressed, safe to cache aggressively.
          {
            urlPattern: /\/assets\/.*\.(?:js|css|woff2)$/,
            handler: "CacheFirst",
            options: {
              cacheName: "crie-static-assets",
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase Storage public files (post thumbnails / asset previews).
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "crie-supabase-storage",
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Generic image CDN / arbitrary <img> remote sources.
          {
            urlPattern: ({ request }) => request.destination === "image",
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "crie-images",
              expiration: {
                maxEntries: 150,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Supabase REST/Edge Functions — fresh-first with short timeout, fallback to cache.
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/(rest|functions)\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "crie-supabase-api",
              networkTimeoutSeconds: 30,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24, // 1 day fallback window
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
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
