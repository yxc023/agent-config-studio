import { createSignal, onMount, Show, For } from "solid-js"
import WorkspaceList from "./components/WorkspaceList"
import ProfileList from "./components/ProfileList"
import TabBar, { type TabType } from "./components/TabBar"
import CardGrid from "./components/CardGrid"
import TitleBar from "./components/TitleBar"
import DiffModal from "./components/DiffModal"
import type { SkillPermission, SkillsDiscovery, AgentsDiscovery, PluginsDiscovery } from "../preload/types"

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
  permission?: {
    skill?: Record<string, SkillPermission>
    [key: string]: unknown
  }
  [key: string]: unknown
}

export interface MergePreview {
  base: ConfigData
  profile?: ConfigData
  merged: ConfigData
  diff: string[]
}

function App() {
  const [workspaces, setWorkspaces] = createSignal<Workspace[]>([])
  const [profiles, setProfiles] = createSignal<Profile[]>([])
  const [selectedWorkspace, setSelectedWorkspace] = createSignal<Workspace | null>(null)
  const [selectedProfile, setSelectedProfile] = createSignal<Profile | null>(null)
  const [workspaceConfig, setWorkspaceConfig] = createSignal<ConfigData | null>(null)
  const [globalConfig, setGlobalConfig] = createSignal<ConfigData | null>(null)
  const [skillsDiscovery, setSkillsDiscovery] = createSignal<SkillsDiscovery | null>(null)
  const [agentsDiscovery, setAgentsDiscovery] = createSignal<AgentsDiscovery | null>(null)
  const [pluginsDiscovery, setPluginsDiscovery] = createSignal<PluginsDiscovery | null>(null)
  const [showDiffModal, setShowDiffModal] = createSignal(false)
  const [diffPreview, setDiffPreview] = createSignal<MergePreview | null>(null)
  const [error, setError] = createSignal<string | null>(null)
  const [toast, setToast] = createSignal<string | null>(null)
  const [activeTab, setActiveTab] = createSignal<TabType>("agents")

  const cardAgents = () => {
    const cfg = workspaceConfig()
    const wsAgentNames = new Set<string>()

    if (cfg?.agent) {
      Object.keys(cfg.agent).forEach((name) => {
        if (name !== "build" && name !== "plan") {
          wsAgentNames.add(name)
        }
      })
    }
    ;(agentsDiscovery()?.workspace || []).forEach((item) => wsAgentNames.add(item.name))

    const globalCfg = globalConfig()
    const wsConfigAgentNames = new Set<string>()
    if (cfg?.agent) {
      Object.keys(cfg.agent).forEach((name) => wsConfigAgentNames.add(name))
    }
    ;(agentsDiscovery()?.workspace || []).forEach((item) => wsConfigAgentNames.add(item.name))

    const workspaceAgents = Array.from(wsAgentNames).sort().map((name) => {
      const agentData = cfg?.agent?.[name] as { disable?: boolean } | undefined
      return {
        name,
        enabled: agentData?.disable !== true,
        isGlobal: false,
      }
    })

    const globalAgentNames = new Set<string>()
    if (globalCfg?.agent) {
      Object.keys(globalCfg.agent).forEach((name) => {
        if (name !== "build" && name !== "plan" && !wsConfigAgentNames.has(name)) {
          globalAgentNames.add(name)
        }
      })
    }
    ;(agentsDiscovery()?.global || []).forEach((item) => {
      if (!wsConfigAgentNames.has(item.name)) {
        globalAgentNames.add(item.name)
      }
    })

    const globalAgents = Array.from(globalAgentNames).sort().map((name) => {
      const agentData = globalCfg?.agent?.[name] as { disable?: boolean } | undefined
      return {
        name,
        enabled: agentData?.disable !== true,
        isGlobal: true,
      }
    })

    return [...workspaceAgents, ...globalAgents]
  }

  const cardSkills = () => {
    const cfg = workspaceConfig()
    const skillPerms = cfg?.permission?.skill as Record<string, SkillPermission> | undefined
    const globalCfg = globalConfig()
    const globalSkillPerms = globalCfg?.permission?.skill as Record<string, SkillPermission> | undefined

    const wsConfigSkillNames = new Set<string>()
    ;(skillsDiscovery()?.workspace || []).forEach((item) => wsConfigSkillNames.add(item.name))
    ;(skillsDiscovery()?.global || []).forEach((item) => wsConfigSkillNames.add(item.name))

    const workspaceSkills = (skillsDiscovery()?.workspace || []).map((item) => {
      const perm = skillPerms?.[item.name] || "deny"
      return {
        name: item.name,
        permission: perm === "ask" ? "allow" : perm,
        ask: perm === "ask",
        isGlobal: false,
      }
    })

    const globalSkills = (skillsDiscovery()?.global || []).map((item) => {
      const perm = globalSkillPerms?.[item.name] || "deny"
      return {
        name: item.name,
        permission: perm === "ask" ? "allow" : perm,
        ask: perm === "ask",
        isGlobal: true,
      }
    })

    return [...workspaceSkills, ...globalSkills]
  }

  const cardPlugins = () => {
    const cfg = workspaceConfig()
    const wsPluginNames = new Set<string>()
    const enabledPlugins = new Set(cfg?.plugin || [])

    ;(pluginsDiscovery()?.workspace || []).forEach((name) => wsPluginNames.add(name))

    const globalCfg = globalConfig()
    const wsConfigPluginNames = new Set<string>()
    ;(cfg?.plugin || []).forEach((name) => wsConfigPluginNames.add(name))
    ;(pluginsDiscovery()?.workspace || []).forEach((name) => wsConfigPluginNames.add(name))

    const workspacePlugins = Array.from(wsPluginNames).sort().map((name) => ({
      name,
      enabled: enabledPlugins.has(name),
      isGlobal: false,
    }))

    const globalPluginNames = new Set<string>()
    ;(globalCfg?.plugin || []).forEach((name) => {
      if (!wsConfigPluginNames.has(name)) {
        globalPluginNames.add(name)
      }
    })
    ;(pluginsDiscovery()?.global || []).forEach((name) => {
      if (!wsConfigPluginNames.has(name)) {
        globalPluginNames.add(name)
      }
    })

    const globalPlugins = Array.from(globalPluginNames).sort().map((name) => ({
      name,
      enabled: (globalCfg?.plugin || []).includes(name),
      isGlobal: true,
    }))

    return [...workspacePlugins, ...globalPlugins]
  }

  async function loadWorkspaces() {
    const list = await window.api.workspaceList()
    setWorkspaces(list)
  }

  async function loadProfiles() {
    const list = await window.api.profileList()
    setProfiles(list)
  }

  async function loadWorkspaceData(workspace: Workspace) {
    if (workspace.configPath) {
      const config = await window.api.configRead(workspace.configPath)
      setWorkspaceConfig(config)
    } else {
      setWorkspaceConfig(null)
    }
    const global = await window.api.globalConfigRead()
    setGlobalConfig(global)
    const [skills, agents, plugins] = await Promise.all([
      window.api.skillsDiscover(workspace.path),
      window.api.agentsDiscover(workspace.path),
      window.api.pluginsDiscover(workspace.path),
    ])
    setSkillsDiscovery(skills)
    setAgentsDiscovery(agents)
    setPluginsDiscovery(plugins)
  }

  async function handleAddWorkspace() {
    try {
      const result = await window.api.workspaceAdd()
      if (result) {
        if (!result.configPath) {
          const initResult = await window.api.workspaceInitialize(result.path)
          result.configPath = initResult.configPath
          setWorkspaceConfig(initResult.config)
        }
        await loadWorkspaces()
        setSelectedWorkspace(result)
        await loadWorkspaceData(result)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add workspace")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleRemoveWorkspace(id: string) {
    await window.api.workspaceRemove(id)
    if (selectedWorkspace()?.id === id) {
      setSelectedWorkspace(null)
      setWorkspaceConfig(null)
      setGlobalConfig(null)
      setSkillsDiscovery(null)
      setAgentsDiscovery(null)
      setPluginsDiscovery(null)
    }
    await loadWorkspaces()
  }

  async function handleSelectWorkspace(workspace: Workspace) {
    setSelectedWorkspace(workspace)
    setSelectedProfile(null)
    await loadWorkspaceData(workspace)
  }

  async function handleToggleAgent(agentName: string, enabled: boolean, isGlobal: boolean) {
    const ws = selectedWorkspace()
    try {
      if (isGlobal) {
        await window.api.globalConfigToggleAgent(agentName, !enabled)
        const global = await window.api.globalConfigRead()
        setGlobalConfig(global)
      } else {
        if (!ws?.configPath) return
        await window.api.configToggleAgent(ws.configPath, agentName, !enabled)
        await loadWorkspaceConfig(ws)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle agent")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleUpdateSkillPermission(skillPattern: string, permission: SkillPermission, isGlobal: boolean) {
    const ws = selectedWorkspace()
    try {
      if (isGlobal) {
        await window.api.globalConfigUpdateSkillPermission(skillPattern, permission)
        const global = await window.api.globalConfigRead()
        setGlobalConfig(global)
      } else {
        if (!ws?.configPath) return
        await window.api.configUpdateSkillPermission(ws.configPath, skillPattern, permission)
        await loadWorkspaceConfig(ws)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill permission")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleSkillAskChange(skillName: string, ask: boolean, isGlobal: boolean) {
    const permission: SkillPermission = ask ? "ask" : "allow"
    await handleUpdateSkillPermission(skillName, permission, isGlobal)
  }

  async function handleDenyAllSkills(skillNames: string[]) {
    const ws = selectedWorkspace()
    if (!ws?.configPath) return
    try {
      for (const name of skillNames) {
        await window.api.configUpdateSkillPermission(ws.configPath, name, "deny")
      }
      await loadWorkspaceConfig(ws)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to deny all skills")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleTogglePlugin(pluginName: string, enabled: boolean, isGlobal: boolean) {
    const ws = selectedWorkspace()
    try {
      if (isGlobal) {
        await window.api.globalConfigTogglePlugin(pluginName, enabled)
        const global = await window.api.globalConfigRead()
        setGlobalConfig(global)
      } else {
        if (!ws?.configPath) return
        await window.api.configTogglePlugin(ws.configPath, pluginName, enabled)
        await loadWorkspaceConfig(ws)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle plugin")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function loadWorkspaceConfig(workspace: Workspace) {
    if (workspace.configPath) {
      const config = await window.api.configRead(workspace.configPath)
      setWorkspaceConfig(config)
    } else {
      setWorkspaceConfig(null)
    }
  }

  async function handleSelectProfile(profile: Profile) {
    setSelectedProfile(profile)
  }

  async function handleCreateProfileFromWorkspace() {
    const ws = selectedWorkspace()
    if (!ws?.configPath) return

    const name = prompt("Enter profile name:")
    if (!name) return

    try {
      await window.api.profileCreateFromWorkspace(ws.configPath, name)
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleCreateBlankProfile() {
    const name = prompt("Enter profile name:")
    if (!name) return

    try {
      await window.api.profileCreateBlank(name)
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create profile")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleDeleteProfile(profile: Profile) {
    if (!confirm(`Delete profile "${profile.name}"?`)) return

    try {
      await window.api.profileDelete(profile.path)
      if (selectedProfile()?.id === profile.id) {
        setSelectedProfile(null)
      }
      await loadProfiles()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete profile")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handlePreviewApply(profile: Profile) {
    const ws = selectedWorkspace()
    if (!ws) return

    try {
      const preview = await window.api.configPreviewMerge(ws.path, profile.path, ["full"])
      setDiffPreview(preview)
      setShowDiffModal(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview merge")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleApplyProfile(sections: string[]) {
    const ws = selectedWorkspace()
    const profile = selectedProfile()
    if (!ws || !profile) return

    try {
      await window.api.configApplyProfile(ws.path, profile.path, sections)
      await loadWorkspaceConfig(ws)
      setShowDiffModal(false)
      setDiffPreview(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply profile")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleOpenInEditor(filePath: string) {
    await window.api.openInExternalEditor(filePath)
  }

  onMount(() => {
    if (window.api) {
      loadWorkspaces()
      loadProfiles()
    }
  })

  return (
    <div id="root" class="h-screen flex flex-col bg-[#f5f5f7] text-[#1d1d1f]">
      <TitleBar />
      <div class="flex-1 flex overflow-hidden">
        <aside class="w-56 bg-white border-r border-[#e5e5e5] flex flex-col">
          <div class="p-4 border-b border-[#f0f0f0]">
            <button
              class="w-full px-4 py-2.5 bg-[#0071e3] text-white text-sm font-medium rounded-lg hover:bg-[#0077ed] transition-colors"
              onClick={handleAddWorkspace}
            >
              + Add Workspace
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-3">
            <div class="text-xs font-semibold text-[#86868b] uppercase tracking-wider px-3 py-2">Workspaces</div>
            <For each={workspaces()}>
              {(workspace) => (
                <button
                  class={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-3 mt-1 transition-colors ${
                    selectedWorkspace()?.id === workspace.id
                      ? "bg-[#f5f5f7]"
                      : "hover:bg-[#f5f5f7]"
                  }`}
                  onClick={() => handleSelectWorkspace(workspace)}
                >
                  <span class="text-[#86868b]">📁</span>
                  <span class="font-medium truncate">{workspace.name}</span>
                </button>
              )}
            </For>
            <Show when={workspaces().length === 0}>
              <div class="text-sm text-[#86868b] px-3 py-2">No workspaces added</div>
            </Show>
          </div>
        </aside>
        <main class="flex-1 flex flex-col overflow-hidden" style={{ "min-width": "600px" }}>
          <Show when={error()}>
            <div class="error-banner">{error()}</div>
          </Show>
          <Show when={toast()}>
            <div class="toast-banner">{toast()}</div>
          </Show>
          <Show when={selectedWorkspace()}>
            <TabBar activeTab={activeTab()} onChange={setActiveTab} />
            <CardGrid
              activeTab={activeTab()}
              agents={cardAgents()}
              skills={cardSkills()}
              plugins={cardPlugins()}
              onToggleAgent={handleToggleAgent}
              onUpdateSkillPermission={(name, perm, isGlobal) => handleUpdateSkillPermission(name, perm, isGlobal)}
              onAskChange={(name, ask, isGlobal) => handleSkillAskChange(name, ask, isGlobal)}
              onTogglePlugin={handleTogglePlugin}
            />
          </Show>
          <Show when={!selectedWorkspace()}>
            <div class="flex flex-col items-center justify-center h-full text-center p-8">
              <div class="text-5xl mb-4 opacity-50">📁</div>
              <div class="text-lg font-semibold mb-2">No workspace selected</div>
              <div class="text-sm text-[#86868b] max-w-xs">Add a workspace to get started, or select one from the sidebar.</div>
            </div>
          </Show>
        </main>
      </div>
      <Show when={showDiffModal() && diffPreview()}>
        <DiffModal
          preview={diffPreview()!}
          onApply={handleApplyProfile}
          onCancel={() => {
            setShowDiffModal(false)
            setDiffPreview(null)
          }}
        />
      </Show>
    </div>
  )
}

export default App
