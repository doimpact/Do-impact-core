// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import path from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";

// Load non-VITE_ env vars into process.env for server routes (never into the client bundle).
Object.assign(process.env, loadEnv(process.env['NODE_ENV'] ?? "development", process.cwd(), ""));

export default defineConfig({
  vite: {
    resolve: {
      alias: [
        // parse5 needs entities v6 subpath exports; keep it on its own nested copy.
        {
          find: "entities/decode",
          replacement: path.resolve(import.meta.dirname, "node_modules/parse5/node_modules/entities/dist/esm/decode.js"),
        },
        {
          find: "entities/escape",
          replacement: path.resolve(import.meta.dirname, "node_modules/parse5/node_modules/entities/dist/esm/escape.js"),
        },
        // React Email's htmlparser2 path needs entities v4.5.0 lib paths.
        {
          find: "entities/lib/decode.js",
          replacement: path.resolve(import.meta.dirname, "node_modules/entities/lib/esm/decode.js"),
        },
        {
          find: "entities/lib/encode.js",
          replacement: path.resolve(import.meta.dirname, "node_modules/entities/lib/esm/encode.js"),
        },
        {
          find: /^entities$/,
          replacement: path.resolve(import.meta.dirname, "node_modules/entities/lib/esm/index.js"),
        },
      ],
    },

    optimizeDeps: {
      include: [
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-dialog",
        "@radix-ui/react-popover",
        "@radix-ui/react-select",
        "@radix-ui/react-switch",
        "@radix-ui/react-tabs",
        "@tiptap/react",
        "@tiptap/starter-kit",
        "cmdk",
        "date-fns",
        "jspdf",
        "jspdf-autotable",
        "recharts",
        "sonner",
        "xlsx",
      ],
    },
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
