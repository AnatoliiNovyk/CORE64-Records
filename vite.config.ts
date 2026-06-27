import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    conditions: ["import", "module", "browser", "default"],
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "react-router-dom": path.resolve(__dirname, "./node_modules/react-router-dom/dist/index.mjs"),
      "react-router/dom": path.resolve(__dirname, "./node_modules/react-router/dist/development/dom-export.mjs"),
      "react-router": path.resolve(__dirname, "./node_modules/react-router/dist/development/index.mjs"),
      "@tanstack/react-query": path.resolve(__dirname, "./node_modules/@tanstack/react-query/build/modern/index.js"),
      "@tanstack/query-core": path.resolve(__dirname, "./node_modules/@tanstack/query-core/build/modern/index.js"),
      "@supabase/supabase-js": path.resolve(__dirname, "./node_modules/@supabase/supabase-js/dist/index.mjs"),
      "next-themes": path.resolve(__dirname, "./node_modules/next-themes/dist/index.mjs"),
      "react-i18next": path.resolve(__dirname, "./node_modules/react-i18next/dist/es/index.js"),
      "i18next": path.resolve(__dirname, "./node_modules/i18next/dist/esm/i18next.js"),
      "i18next-browser-languagedetector": path.resolve(__dirname, "./node_modules/i18next-browser-languagedetector/dist/esm/i18nextBrowserLanguageDetector.js"),
    },
  },
  optimizeDeps: {
    include: [
      "react",
      "react-dom/client",
      "react-router",
      "@tanstack/react-query",
      "@supabase/supabase-js",
      "next-themes",
      "lucide-react",
      "sonner",
      "clsx",
      "tailwind-merge",
      "class-variance-authority",
      "zod",
      "react-hook-form",
      "@hookform/resolvers/zod",
      "date-fns",
      "cmdk",
      "recharts",
      "vaul",
      "input-otp",
      "embla-carousel-react",
      "react-resizable-panels",
      "react-day-picker",
      "radix-ui",
      "i18next",
      "react-i18next",
      "i18next-browser-languagedetector",
    ],
  },
})
