import { app, BrowserWindow } from "electron"
import { join, dirname } from "node:path"
import { fileURLToPath } from "node:url"

import { WORKSPACE_CONFIG_MANAGER_APP_ID } from "./constants"
import { createMainWindow } from "./windows"
import { registerIpcHandlers } from "./ipc"

const root = dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

app.setName("OpenCode Workspace Config Manager")
app.setAppUserModelId(WORKSPACE_CONFIG_MANAGER_APP_ID)
app.setPath("userData", join(app.getPath("appData"), WORKSPACE_CONFIG_MANAGER_APP_ID))

registerIpcHandlers()

app.on("ready", () => {
  mainWindow = createMainWindow()
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("activate", () => {
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})
