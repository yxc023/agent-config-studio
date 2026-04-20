import { ipcMain, dialog, shell, app } from "electron"
import type { IpcMainInvokeEvent } from "electron"
import { randomUUID } from "node:crypto"
import { join, basename } from "node:path"
import { readFile } from "node:fs/promises"

import { PROFILES_DIR, GLOBAL_CONFIG_DIR } from "./constants"
import { getStore } from "./store"
import {
  findOpencodeConfig,
  readConfig,
  writeConfig,
  listProfiles,
  createProfile,
  deleteProfile,
  renameProfile,
  copyConfigToProfile,
  readGlobalConfig,
  discoverSkills,
  discoverGlobalSkills,
  discoverAgents,
  discoverPlugins,
  type Workspace,
  type Profile,
  type ConfigData,
} from "./fileOps"
import { mergeConfig, diffConfigs } from "./jsonc"

export function registerIpcHandlers() {
  ipcMain.handle("workspace-list", async () => {
    const store = getStore()
    const workspaces = (store.get("workspaces") as Workspace[]) || []
    return workspaces
  })

  ipcMain.handle("workspace-add", async (_event: IpcMainInvokeEvent) => {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory", "createDirectory"],
      title: "Select workspace directory",
    })
    if (result.canceled || result.filePaths.length === 0) return null

    const dirPath = result.filePaths[0]
    const configPath = await findOpencodeConfig(dirPath)

    if (!configPath) {
      throw new Error("Selected directory does not contain opencode.json or opencode.jsonc")
    }

    const store = getStore()
    const workspaces = (store.get("workspaces") as Workspace[]) || []

    const existing = workspaces.find((w) => w.path === dirPath)
    if (existing) {
      throw new Error("Workspace already added")
    }

    const workspace: Workspace = {
      id: randomUUID(),
      name: basename(dirPath),
      path: dirPath,
      configPath,
    }

    workspaces.push(workspace)
    store.set("workspaces", workspaces)

    return workspace
  })

  ipcMain.handle("workspace-remove", async (_event: IpcMainInvokeEvent, workspaceId: string) => {
    const store = getStore()
    const workspaces = (store.get("workspaces") as Workspace[]) || []
    const filtered = workspaces.filter((w) => w.id !== workspaceId)
    store.set("workspaces", filtered)
    return true
  })

  ipcMain.handle("workspace-select", async (_event: IpcMainInvokeEvent, workspaceId: string) => {
    const store = getStore()
    const workspaces = (store.get("workspaces") as Workspace[]) || []
    return workspaces.find((w) => w.id === workspaceId) || null
  })

  ipcMain.handle("config-read", async (_event: IpcMainInvokeEvent, configPath: string) => {
    return readConfig(configPath)
  })

  ipcMain.handle("config-write", async (_event: IpcMainInvokeEvent, configPath: string, data: ConfigData) => {
    await writeConfig(configPath, data)
    return true
  })

  ipcMain.handle("config-apply-profile", async (_event: IpcMainInvokeEvent, workspacePath: string, profilePath: string, sections: string[]) => {
    const workspaceConfigPath = await findOpencodeConfig(workspacePath)
    if (!workspaceConfigPath) throw new Error("Workspace has no opencode config")

    const baseConfig = await readConfig(workspaceConfigPath)
    const profileConfig = await readConfig(profilePath)

    const merged = mergeConfig(baseConfig, profileConfig, sections)
    await writeConfig(workspaceConfigPath, merged)

    return { base: baseConfig, merged, diff: diffConfigs(baseConfig, merged) }
  })

  ipcMain.handle("config-preview-merge", async (_event: IpcMainInvokeEvent, workspacePath: string, profilePath: string, sections: string[]) => {
    const workspaceConfigPath = await findOpencodeConfig(workspacePath)
    if (!workspaceConfigPath) throw new Error("Workspace has no opencode config")

    const baseConfig = await readConfig(workspaceConfigPath)
    const profileConfig = await readConfig(profilePath)

    const merged = mergeConfig(baseConfig, profileConfig, sections)

    return { base: baseConfig, profile: profileConfig, merged, diff: diffConfigs(baseConfig, merged) }
  })

  ipcMain.handle("profile-list", async () => {
    return listProfiles(PROFILES_DIR)
  })

  ipcMain.handle("profile-create-from-workspace", async (_event: IpcMainInvokeEvent, workspaceConfigPath: string, profileName: string) => {
    return copyConfigToProfile(workspaceConfigPath, PROFILES_DIR, profileName)
  })

  ipcMain.handle("profile-create-blank", async (_event: IpcMainInvokeEvent, profileName: string) => {
    return createProfile(PROFILES_DIR, profileName, {})
  })

  ipcMain.handle("profile-delete", async (_event: IpcMainInvokeEvent, profilePath: string) => {
    await deleteProfile(profilePath)
    return true
  })

  ipcMain.handle("profile-rename", async (_event: IpcMainInvokeEvent, profilePath: string, newName: string) => {
    const newPath = await renameProfile(profilePath, newName)
    return newPath
  })

  ipcMain.handle("open-in-external-editor", async (_event: IpcMainInvokeEvent, filePath: string) => {
    return shell.openPath(filePath)
  })

  ipcMain.handle("get-app-path", async () => {
    return app.getPath("userData")
  })

  ipcMain.handle("global-config-read", async () => {
    return readGlobalConfig()
  })

  ipcMain.handle("skills-discover", async (_event: IpcMainInvokeEvent, workspacePath: string) => {
    const workspaceSkills = await discoverSkills(workspacePath)
    const globalSkills = await discoverGlobalSkills()
    return {
      workspace: workspaceSkills,
      global: globalSkills.filter((s) => !workspaceSkills.includes(s)),
    }
  })

  ipcMain.handle("agents-discover", async (_event: IpcMainInvokeEvent, workspacePath: string) => {
    const workspaceAgents = await discoverAgents(workspacePath)
    const globalAgents = await discoverAgents(GLOBAL_CONFIG_DIR)
    return {
      workspace: workspaceAgents,
      global: globalAgents.filter((a) => !workspaceAgents.includes(a)),
    }
  })

  ipcMain.handle("plugins-discover", async (_event: IpcMainInvokeEvent, workspacePath: string) => {
    const workspacePlugins = await discoverPlugins(workspacePath)
    const globalPlugins = await discoverPlugins(GLOBAL_CONFIG_DIR)
    return {
      workspace: workspacePlugins,
      global: globalPlugins.filter((p) => !workspacePlugins.includes(p)),
    }
  })

  ipcMain.handle("workspace-initialize", async (_event: IpcMainInvokeEvent, workspacePath: string) => {
    const configPath = join(workspacePath, "opencode.jsonc")
    const templatePath = join(app.getAppPath(), "resources", "default-template.jsonc")

    const templateContent = await readFile(templatePath, "utf-8")
    const { parse } = await import("jsonc-parser")
    const errors: import("jsonc-parser").ParseError[] = []
    const configData = parse(templateContent, errors) as ConfigData
    if (errors.length > 0) {
      throw new Error("Invalid template file")
    }

    await writeConfig(configPath, configData)
    return { configPath, config: configData }
  })

  ipcMain.handle("config-toggle-agent", async (_event: IpcMainInvokeEvent, configPath: string, agentName: string, disabled: boolean) => {
    const config = await readConfig(configPath)
    if (!config.agent) {
      config.agent = {}
    }
    if (!config.agent[agentName]) {
      config.agent[agentName] = {}
    }
    ;(config.agent[agentName] as Record<string, unknown>).disable = disabled
    await writeConfig(configPath, config)
    return true
  })

  ipcMain.handle("config-update-skill-permission", async (_event: IpcMainInvokeEvent, configPath: string, skillPattern: string, permission: "allow" | "ask" | "deny") => {
    const config = await readConfig(configPath)
    if (!config.permission) {
      config.permission = {}
    }
    const perm = config.permission as Record<string, Record<string, unknown>>
    if (!perm.skill) {
      perm.skill = {}
    }
    perm.skill[skillPattern] = permission
    await writeConfig(configPath, config)
    return true
  })

  ipcMain.handle("config-toggle-plugin", async (_event: IpcMainInvokeEvent, configPath: string, pluginName: string, enabled: boolean) => {
    const config = await readConfig(configPath)
    if (!config.plugin) {
      config.plugin = []
    }
    const index = config.plugin.indexOf(pluginName)
    if (enabled && index === -1) {
      config.plugin.push(pluginName)
    } else if (!enabled && index !== -1) {
      config.plugin.splice(index, 1)
    }
    await writeConfig(configPath, config)
    return true
  })
}
