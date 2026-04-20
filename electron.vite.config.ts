import { defineConfig } from "electron-vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import { join } from "node:path"

export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        input: { index: join(__dirname, "src/main/index.ts") },
      },
    },
  },
  preload: {
    build: {
      rollupOptions: {
        input: { index: join(__dirname, "src/preload/index.ts") },
      },
    },
  },
  renderer: {
    plugins: [solid(), tailwindcss()],
    root: join(__dirname, "src/renderer"),
    build: {
      rollupOptions: {
        input: { main: join(__dirname, "src/renderer/index.html") },
      },
    },
  },
})
