import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist/spa",
    emptyOutDir: true,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      // Exclude SSR-only entry points
      external: [],
      input: "index.html",
      output: {
        manualChunks(id) {
          // Firebase — load only when auth/firestore is used
          if (id.includes("node_modules/firebase")) {
            return "firebase";
          }
          // Leaflet map — only on map page
          if (id.includes("node_modules/leaflet") || id.includes("node_modules/react-leaflet")) {
            return "map";
          }
          // Recharts — only on pages with charts
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "charts";
          }
          // QR code
          if (id.includes("node_modules/qrcode")) {
            return "qrcode";
          }
          // Radix UI
          if (id.includes("node_modules/@radix-ui")) {
            return "radix";
          }
          // TanStack
          if (id.includes("node_modules/@tanstack")) {
            return "tanstack";
          }
          // React core
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react";
          }
          // Route pages — each gets its own chunk
          if (id.includes("src/routes/_app/map")) return "page-map";
          if (id.includes("src/routes/_app/intelligence")) return "page-intelligence";
          if (id.includes("src/routes/_app/vaccination")) return "page-vaccination";
          if (id.includes("src/routes/_app/resources")) return "page-resources";
          if (id.includes("src/routes/_app/passport-builder")) return "page-passport-builder";
          if (id.includes("src/routes/_app/passport")) return "page-passport";
          if (id.includes("src/routes/_app/planning")) return "page-planning";
          if (id.includes("src/routes/_app/symptoms")) return "page-symptoms";
          if (id.includes("src/routes/_app/offline")) return "page-offline";
          if (id.includes("src/routes/passport.scan")) return "page-scan";
        },
      },
    },
  },
});
