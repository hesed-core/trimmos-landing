import { defineConfig } from "astro/config";
export default defineConfig({
  site: "https://www.trimmos.com",
  output: "static",
  // Original screenshots stay private; only processed assets are served.
  publicDir: "./public-safe",
  compressHTML: true,
  vite: {
    define: {
      "import.meta.env.VERCEL": JSON.stringify(process.env.VERCEL ?? ""),
    },
  },
});
