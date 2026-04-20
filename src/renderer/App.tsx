import { createSignal, onMount, Show } from "solid-js"
import WorkspaceList from "./components/WorkspaceList"
import ProfileList from "./components/ProfileList"
import ConfigViewer from "./components/ConfigViewer"
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

  async function handleToggleAgent(agentName: string, disabled: boolean) {
    const ws = selectedWorkspace()
    if (!ws?.configPath) return
    try {
      await window.api.configToggleAgent(ws.configPath, agentName, disabled)
      await loadWorkspaceConfig(ws)
      setToast("Config saved")
      setTimeout(() => setToast(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle agent")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleUpdateSkillPermission(skillPattern: string, permission: SkillPermission) {
    const ws = selectedWorkspace()
    if (!ws?.configPath) return
    try {
      await window.api.configUpdateSkillPermission(ws.configPath, skillPattern, permission)
      await loadWorkspaceConfig(ws)
      setToast("Config saved")
      setTimeout(() => setToast(null), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update skill permission")
      setTimeout(() => setError(null), 3000)
    }
  }

  async function handleTogglePlugin(pluginName: string, enabled: boolean) {
    const ws = selectedWorkspace()
    if (!ws?.configPath) return
    try {
      await window.api.configTogglePlugin(ws.configPath, pluginName, enabled)
      await loadWorkspaceConfig(ws)
      setToast("Config saved")
      setTimeout(() => setToast(null), 2000)
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
    <div id="root">
      <div class="app">
        <aside class="sidebar">
          <div class="sidebar-header">
            <button class="button button-primary button-small" onClick={handleAddWorkspace}>
              + Add
            </button>
          </div>
          <div class="sidebar-content">
            <div class="sidebar-section">
              <div class="sidebar-section-title">Workspaces</div>
              <WorkspaceList
                workspaces={workspaces()}
                selected={selectedWorkspace()}
                onSelect={handleSelectWorkspace}
                onRemove={handleRemoveWorkspace}
              />
            </div>
            <div class="sidebar-section">
              <div class="sidebar-section-title">Profiles</div>
              <ProfileList
                profiles={profiles()}
                selected={selectedProfile()}
                onSelect={handleSelectProfile}
                onDelete={handleDeleteProfile}
                onCreateFromWorkspace={handleCreateProfileFromWorkspace}
                onCreateBlank={handleCreateBlankProfile}
                hasSelectedWorkspace={!!selectedWorkspace()}
              />
            </div>
          </div>
        </aside>
        <main class="main-content">
          <Show when={error()}>
            <div class="error-banner">{error()}</div>
          </Show>
          <Show when={toast()}>
            <div class="toast-banner">{toast()}</div>
          </Show>
          <Show when={selectedWorkspace()}>
            <ConfigViewer
              workspace={selectedWorkspace()!}
              workspaceConfig={workspaceConfig()}
              globalConfig={globalConfig()}
              skillsDiscovery={skillsDiscovery()}
              agentsDiscovery={agentsDiscovery()}
              pluginsDiscovery={pluginsDiscovery()}
              onToggleAgent={handleToggleAgent}
              onUpdateSkillPermission={handleUpdateSkillPermission}
              onTogglePlugin={handleTogglePlugin}
              onOpenInEditor={handleOpenInEditor}
            />
          </Show>
          <Show when={!selectedWorkspace()}>
            <div class="empty-state">
              <div class="empty-state-icon">📁</div>
              <div class="empty-state-title">No workspace selected</div>
              <div class="empty-state-desc">Add a workspace to get started, or select one from the sidebar.</div>
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
