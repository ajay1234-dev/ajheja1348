import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";

export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...(process.env.NODE_ENV !== "production" &&
    process.env.REPL_ID !== undefined
      ? [
          await import("@replit/vite-plugin-cartographer").then((m) =>
            m.cartographer()
          ),
          await import("@replit/vite-plugin-dev-banner").then((m) =>
            m.devBanner()
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client/src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      // "@assets": path.resolve(import.meta.dirname, "attached_assets"),
      // "@/components": path.resolve(import.meta.dirname, "client", "src", "components"),
      // "@/components/ui": path.resolve(import.meta.dirname, "client", "src", "components", "ui"),
      // "@/components/ui/toaster": path.resolve(import.meta.dirname, "client", "src", "components", "ui", "toaster.tsx"),
      // "@/components/ui/tooltip": path.resolve(import.meta.dirname, "client", "src", "components", "ui", "tooltip.tsx"),
      // "@/hooks": path.resolve(import.meta.dirname, "client", "src", "hooks"),
      // "@/hooks/use-auth": path.resolve(import.meta.dirname, "client", "src", "hooks", "use-auth.tsx"),
      // "@/hooks/use-voice": path.resolve(import.meta.dirname, "client", "src", "hooks", "use-voice.tsx"),
      // "@/pages": path.resolve(import.meta.dirname, "client", "src", "pages"),
      // "@/pages/not-found": path.resolve(import.meta.dirname, "client", "src", "pages", "not-found.tsx"),
      // "@/pages/auth": path.resolve(import.meta.dirname, "client", "src", "pages", "auth"),
      // "@/pages/auth/login": path.resolve(import.meta.dirname, "client", "src", "pages", "auth", "login.tsx"),
      // "@/pages/auth/register": path.resolve(import.meta.dirname, "client", "src", "pages", "auth", "register.tsx"),
      // "@/pages/dashboard": path.resolve(import.meta.dirname, "client", "src", "pages", "dashboard.tsx"),
      // "@/pages/doctor-dashboard": path.resolve(import.meta.dirname, "client", "src", "pages", "doctor-dashboard.tsx"),
      // "@/pages/doctor-approval": path.resolve(import.meta.dirname, "client", "src", "pages", "doctor-approval.tsx"),
      // "@/pages/patient-timeline": path.resolve(import.meta.dirname, "client", "src", "pages", "patient-timeline.tsx"),
      // "@/pages/patient-history": path.resolve(import.meta.dirname, "client", "src", "pages", "patient-history.tsx"),
      // "@/pages/upload": path.resolve(import.meta.dirname, "client", "src", "pages", "upload.tsx"),
      // "@/pages/reports": path.resolve(import.meta.dirname, "client", "src", "pages", "reports.tsx"),
      // "@/pages/medications": path.resolve(import.meta.dirname, "client", "src", "pages", "medications.tsx"),
      // "@/pages/timeline": path.resolve(import.meta.dirname, "client", "src", "pages", "timeline.tsx"),
      // "@/pages/reminders": path.resolve(import.meta.dirname, "client", "src", "pages", "reminders.tsx"),
      // "@/pages/share": path.resolve(import.meta.dirname, "client", "src", "pages", "share.tsx"),
      // "@/pages/profile": path.resolve(import.meta.dirname, "client", "src", "pages", "profile.tsx"),
      // "@/pages/health-timeline-demo": path.resolve(import.meta.dirname, "client", "src", "pages", "health-timeline-demo.tsx"),
      // "@/pages/health-timeline-production-demo": path.resolve(import.meta.dirname, "client", "src", "pages", "health-timeline-production-demo.tsx"),
      // "@/components/layout": path.resolve(import.meta.dirname, "client", "src", "components", "layout"),
      // "@/components/layout/main-layout": path.resolve(import.meta.dirname, "client", "src", "components", "layout", "main-layout.tsx"),
      // "@/lib": path.resolve(import.meta.dirname, "client", "src", "lib"),
      // "@/types": path.resolve(import.meta.dirname, "client", "src", "types"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
    // Optimize build performance
    rollupOptions: {
      output: {
        // Split vendor and app code for better caching
        manualChunks: {
          vendor: [
            "react",
            "react-dom",
            "react-router-dom",
            "wouter",
            "@tanstack/react-query",
          ],
          ui: [
            "lucide-react",
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-tooltip",
          ],
          utils: ["date-fns", "clsx", "tailwind-merge"],
        },
      },
    },
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Generate CSS sourcemaps in development
    sourcemap: process.env.NODE_ENV === "development",
    // Minify with terser for better compression
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    // Enable compression for better performance
  },
  // Enable caching for better performance
  cacheDir: "node_modules/.vite",
});
