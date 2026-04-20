import windowState from "electron-window-state"
import { app, BrowserWindow } from "electron"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { APP_NAME } from "./constants"

const root = dirname(fileURLToPath(import.meta.url))

export function createMainWindow() {
  const state = windowState({
    defaultWidth: 1000,
    defaultHeight: 700,
  })

  const win = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    show: false,
    title: APP_NAME,
    backgroundColor: "#1e1e1e",
    ...(process.platform === "darwin"
      ? {
          titleBarStyle: "hiddenInset" as const,
        }
      : {}),
    webPreferences: {
      preload: join(root, "../preload/index.mjs"),
      sandbox: false,
    },
  })

  state.manage(win)
  loadWindow(win, "index.html")

  win.once("ready-to-show", () => {
    win.show()
  })

  return win
}

function loadWindow(win: BrowserWindow, html: string) {
  const devUrl = process.env.ELECTRON_RENDERER_URL
  if (devUrl) {
    const url = new URL(html, devUrl)
    void win.loadURL(url.toString())
    return
  }

  void win.loadFile(join(root, `../renderer/${html}`))
}
