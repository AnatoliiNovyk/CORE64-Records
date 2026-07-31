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
