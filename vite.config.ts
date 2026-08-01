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
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react/') || id.includes('react-dom/') || id.includes('react-router')) {
              return 'vendor-react'
            }
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('@radix-ui') || id.includes('radix-ui')) {
              return 'vendor-ui'
            }
          }
        },
      },
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
