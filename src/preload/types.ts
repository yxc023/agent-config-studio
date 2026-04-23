export interface Workspace {
  id: string
  name: string
  path: string
  configPath: string | null
}

export interface Profile {
  id: string
  name: string
  path: string
}

export interface ConfigData {
  agent?: Record<string, unknown>
  plugin?: string[]
  [key: string]: unknown
}

export interface MergePreview {
  base: ConfigData
  profile?: ConfigData
  merged: ConfigData
  diff: string[]
}

export interface DiscoveredItem {
  name: string
  fullPath: string
  directory: string
  description: string
}

export interface AgentsDiscovery {
  workspace: DiscoveredItem[]
  global: DiscoveredItem[]
}

export interface SkillsDiscovery {
  workspace: DiscoveredItem[]
  global: DiscoveredItem[]
}

export interface AgentItem {
  name: string
  fullPath: string
  enabled: boolean
  isGlobal: boolean
  directory: string
  description: string
}

export interface SkillItem {
  name: string
  fullPath: string
  permission: "allow" | "deny"
  isGlobal: boolean
  directory: string
  description: string
}

export interface PluginsDiscovery {
  workspace: string[]
  global: string[]
}

export type SkillPermission = "allow" | "ask" | "deny"

export interface ElectronAPI {
  workspaceList: () => Promise<Workspace[]>
  workspaceAdd: () => Promise<Workspace | null>
  workspaceRemove: (id: string) => Promise<boolean>
  workspaceSelect: (id: string) => Promise<Workspace | null>

  configRead: (path: string) => Promise<ConfigData>
  configWrite: (path: string, data: ConfigData) => Promise<boolean>
  configApplyProfile: (workspacePath: string, profilePath: string, sections: string[]) => Promise<{ base: ConfigData; merged: ConfigData; diff: string[] }>
  configPreviewMerge: (workspacePath: string, profilePath: string, sections: string[]) => Promise<MergePreview>

  globalConfigRead: () => Promise<ConfigData | null>
  skillsDiscover: (workspacePath: string) => Promise<SkillsDiscovery>
  agentsDiscover: (workspacePath: string) => Promise<AgentsDiscovery>
  pluginsDiscover: (workspacePath: string) => Promise<PluginsDiscovery>
  workspaceInitialize: (workspacePath: string) => Promise<{ configPath: string; config: ConfigData }>

  configToggleAgent: (configPath: string, agentName: string, disabled: boolean) => Promise<boolean>
  configUpdateSkillPermission: (configPath: string, skillPattern: string, permission: SkillPermission) => Promise<boolean>
  configTogglePlugin: (configPath: string, pluginName: string, enabled: boolean) => Promise<boolean>

  globalConfigToggleAgent: (agentName: string, disabled: boolean) => Promise<boolean>
  globalConfigUpdateSkillPermission: (skillPattern: string, permission: SkillPermission) => Promise<boolean>
  globalConfigTogglePlugin: (pluginName: string, enabled: boolean) => Promise<boolean>

  profileList: () => Promise<Profile[]>
  profileCreateFromWorkspace: (workspaceConfigPath: string, profileName: string) => Promise<Profile>
  profileCreateBlank: (profileName: string) => Promise<Profile>
  profileDelete: (path: string) => Promise<boolean>
  profileRename: (path: string, newName: string) => Promise<string>

  openInExternalEditor: (filePath: string) => Promise<string>
  getAppPath: () => Promise<string>
}

declare global {
  interface Window {
    api: ElectronAPI
  }
}
