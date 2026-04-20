import { contextBridge, ipcRenderer } from "electron"
import type { ElectronAPI } from "./types"

const api: ElectronAPI = {
  workspaceList: () => ipcRenderer.invoke("workspace-list"),
  workspaceAdd: () => ipcRenderer.invoke("workspace-add"),
  workspaceRemove: (id: string) => ipcRenderer.invoke("workspace-remove", id),
  workspaceSelect: (id: string) => ipcRenderer.invoke("workspace-select", id),

  configRead: (path: string) => ipcRenderer.invoke("config-read", path),
  configWrite: (path: string, data) => ipcRenderer.invoke("config-write", path, data),
  configApplyProfile: (workspacePath: string, profilePath: string, sections: string[]) =>
    ipcRenderer.invoke("config-apply-profile", workspacePath, profilePath, sections),
  configPreviewMerge: (workspacePath: string, profilePath: string, sections: string[]) =>
    ipcRenderer.invoke("config-preview-merge", workspacePath, profilePath, sections),

  globalConfigRead: () => ipcRenderer.invoke("global-config-read"),
  skillsDiscover: (workspacePath: string) => ipcRenderer.invoke("skills-discover", workspacePath),
  workspaceInitialize: (workspacePath: string) => ipcRenderer.invoke("workspace-initialize", workspacePath),

  configToggleAgent: (configPath: string, agentName: string, disabled: boolean) =>
    ipcRenderer.invoke("config-toggle-agent", configPath, agentName, disabled),
  configUpdateSkillPermission: (configPath: string, skillPattern: string, permission) =>
    ipcRenderer.invoke("config-update-skill-permission", configPath, skillPattern, permission),
  configTogglePlugin: (configPath: string, pluginName: string, enabled: boolean) =>
    ipcRenderer.invoke("config-toggle-plugin", configPath, pluginName, enabled),

  profileList: () => ipcRenderer.invoke("profile-list"),
  profileCreateFromWorkspace: (workspaceConfigPath: string, profileName: string) =>
    ipcRenderer.invoke("profile-create-from-workspace", workspaceConfigPath, profileName),
  profileCreateBlank: (profileName: string) => ipcRenderer.invoke("profile-create-blank", profileName),
  profileDelete: (path: string) => ipcRenderer.invoke("profile-delete", path),
  profileRename: (path: string, newName: string) => ipcRenderer.invoke("profile-rename", path, newName),

  openInExternalEditor: (filePath: string) => ipcRenderer.invoke("open-in-external-editor", filePath),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
}

contextBridge.exposeInMainWorld("api", api)
