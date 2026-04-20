import { defineConfig } from "electron-vite"
import solid from "vite-plugin-solid"
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
    plugins: [solid()],
    root: join(__dirname, "src/renderer"),
    build: {
      rollupOptions: {
        input: { main: join(__dirname, "src/renderer/index.html") },
      },
    },
  },
})
