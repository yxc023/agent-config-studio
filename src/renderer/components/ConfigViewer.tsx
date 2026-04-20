import { For, Show, createSignal } from "solid-js"
import type { Workspace, ConfigData } from "../App"
import type { SkillPermission, SkillsDiscovery } from "../../preload/types"

interface Props {
  workspace: Workspace
  workspaceConfig: ConfigData | null
  globalConfig: ConfigData | null
  skillsDiscovery: SkillsDiscovery | null
  onToggleAgent: (agentName: string, disabled: boolean) => void
  onUpdateSkillPermission: (skillPattern: string, permission: SkillPermission) => void
  onTogglePlugin: (pluginName: string, enabled: boolean) => void
  onOpenInEditor: (path: string) => void
}

interface AgentItem {
  name: string
  disabled: boolean
  isGlobal: boolean
}

interface SkillItem {
  name: string
  permission: SkillPermission
  isGlobal: boolean
}

interface PluginItem {
  name: string
  enabled: boolean
  isGlobal: boolean
}

export default function ConfigViewer(props: Props) {
  const [agentsExpanded, setAgentsExpanded] = createSignal(true)
  const [skillsExpanded, setSkillsExpanded] = createSignal(true)
  const [pluginsExpanded, setPluginsExpanded] = createSignal(true)

  const workspaceAgents = (): AgentItem[] => {
    const cfg = props.workspaceConfig
    if (!cfg?.agent) return []
    return Object.entries(cfg.agent)
      .filter(([key]) => key !== "build" && key !== "plan")
      .map(([name, agent]) => {
        const agentData = agent as { disable?: boolean }
        return { name, disabled: agentData.disable ?? false, isGlobal: false }
      })
  }

  const globalAgents = (): AgentItem[] => {
    const cfg = props.globalConfig
    if (!cfg?.agent) return []
    return Object.entries(cfg.agent)
      .filter(([key]) => key !== "build" && key !== "plan")
      .filter(([name]) => !props.workspaceConfig?.agent?.[name])
      .map(([name, agent]) => {
        const agentData = agent as { disable?: boolean }
        return { name, disabled: agentData.disable ?? false, isGlobal: true }
      })
  }

  const workspaceSkills = (): SkillItem[] => {
    const cfg = props.workspaceConfig
    const wsSkillNames = props.skillsDiscovery?.workspace || []
    if (!cfg?.permission?.skill) {
      return wsSkillNames.map((name) => ({ name, permission: "deny" as SkillPermission, isGlobal: false }))
    }
    const skillPerms = cfg.permission.skill as Record<string, SkillPermission>
    return wsSkillNames.map((name) => ({
      name,
      permission: skillPerms[name] || "deny",
      isGlobal: false,
    }))
  }

  const globalSkills = (): SkillItem[] => {
    const cfg = props.globalConfig
    const globalSkillNames = props.skillsDiscovery?.global || []
    if (!cfg?.permission?.skill) {
      return globalSkillNames.map((name) => ({ name, permission: "deny" as SkillPermission, isGlobal: true }))
    }
    const skillPerms = cfg.permission.skill as Record<string, SkillPermission>
    return globalSkillNames.map((name) => ({
      name,
      permission: skillPerms[name] || "deny",
      isGlobal: true,
    }))
  }

  const workspacePlugins = (): PluginItem[] => {
    const cfg = props.workspaceConfig
    const plugins = cfg?.plugin || []
    return plugins.map((name) => ({ name, enabled: true, isGlobal: false }))
  }

  const globalPlugins = (): PluginItem[] => {
    const cfg = props.globalConfig
    const wsPlugins = props.workspaceConfig?.plugin || []
    const globalPluginNames = (cfg?.plugin || []).filter((p) => !wsPlugins.includes(p))
    return globalPluginNames.map((name) => ({ name, enabled: true, isGlobal: true }))
  }

  const handleAgentToggle = (name: string, disabled: boolean) => {
    if (props.workspace.configPath) {
      props.onToggleAgent(name, disabled)
    }
  }

  const handleSkillPermissionChange = (name: string, permission: SkillPermission) => {
    if (props.workspace.configPath) {
      props.onUpdateSkillPermission(name, permission)
    }
  }

  const handlePluginToggle = (name: string, enabled: boolean) => {
    if (props.workspace.configPath) {
      props.onTogglePlugin(name, enabled)
    }
  }

  return (
    <>
      <div class="content-header">
        <h2>{props.workspace.name}</h2>
        <div class="content-actions">
          <button
            class="button button-secondary"
            onClick={() => props.workspace.configPath && props.onOpenInEditor(props.workspace.configPath)}
          >
            Open in Editor
          </button>
        </div>
      </div>
      <div class="content-body">
        <Show when={props.workspaceConfig} fallback={<div class="empty-state">No config found</div>}>
          <div class="config-section">
            <div class="config-section-header" onClick={() => setAgentsExpanded(!agentsExpanded())}>
              <div class="config-section-title">
                <span class="collapse-icon">{agentsExpanded() ? "▼" : "▶"}</span>
                <span>Agents</span>
                <span class="count">{workspaceAgents().length + globalAgents().length}</span>
              </div>
            </div>
            <Show when={agentsExpanded()}>
              <Show when={workspaceAgents().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title">Workspace</div>
                  <div class="config-items">
                    <For each={workspaceAgents()}>
                      {(agent) => (
                        <div class="config-item">
                          <div class="config-item-info">
                            <div class="config-item-name">{agent.name}</div>
                          </div>
                          <label class="toggle-switch">
                            <input
                              type="checkbox"
                              checked={!agent.disabled}
                              onChange={(e) => handleAgentToggle(agent.name, !e.currentTarget.checked)}
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              <Show when={globalAgents().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title global-title">Global (Read-only)</div>
                  <div class="config-items">
                    <For each={globalAgents()}>
                      {(agent) => (
                        <div class="config-item global-item">
                          <div class="config-item-info">
                            <div class="config-item-name">🔒 {agent.name}</div>
                          </div>
                          <span class="badge">{agent.disabled ? "disabled" : "enabled"}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </Show>
          </div>

          <div class="config-section">
            <div class="config-section-header" onClick={() => setSkillsExpanded(!skillsExpanded())}>
              <div class="config-section-title">
                <span class="collapse-icon">{skillsExpanded() ? "▼" : "▶"}</span>
                <span>Skills</span>
                <span class="count">{workspaceSkills().length + globalSkills().length}</span>
              </div>
            </div>
            <Show when={skillsExpanded()}>
              <Show when={workspaceSkills().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title">Workspace</div>
                  <div class="config-items">
                    <For each={workspaceSkills()}>
                      {(skill) => (
                        <div class="config-item">
                          <div class="config-item-info">
                            <div class="config-item-name">{skill.name}</div>
                          </div>
                          <select
                            class="permission-select"
                            value={skill.permission}
                            onChange={(e) => handleSkillPermissionChange(skill.name, e.currentTarget.value as SkillPermission)}
                          >
                            <option value="allow">allow</option>
                            <option value="ask">ask</option>
                            <option value="deny">deny</option>
                          </select>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              <Show when={globalSkills().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title global-title">Global (Read-only)</div>
                  <div class="config-items">
                    <For each={globalSkills()}>
                      {(skill) => (
                        <div class="config-item global-item">
                          <div class="config-item-info">
                            <div class="config-item-name">🔒 {skill.name}</div>
                          </div>
                          <span class="badge">{skill.permission}</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </Show>
          </div>

          <div class="config-section">
            <div class="config-section-header" onClick={() => setPluginsExpanded(!pluginsExpanded())}>
              <div class="config-section-title">
                <span class="collapse-icon">{pluginsExpanded() ? "▼" : "▶"}</span>
                <span>Plugins</span>
                <span class="count">{workspacePlugins().length + globalPlugins().length}</span>
              </div>
            </div>
            <Show when={pluginsExpanded()}>
              <Show when={workspacePlugins().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title">Workspace</div>
                  <div class="config-items">
                    <For each={workspacePlugins()}>
                      {(plugin) => (
                        <div class="config-item">
                          <div class="config-item-info">
                            <div class="config-item-name">{plugin.name}</div>
                          </div>
                          <label class="toggle-switch">
                            <input
                              type="checkbox"
                              checked={plugin.enabled}
                              onChange={(e) => handlePluginToggle(plugin.name, e.currentTarget.checked)}
                            />
                            <span class="toggle-slider"></span>
                          </label>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
              <Show when={globalPlugins().length > 0}>
                <div class="config-subgroup">
                  <div class="config-subgroup-title global-title">Global (Read-only)</div>
                  <div class="config-items">
                    <For each={globalPlugins()}>
                      {(plugin) => (
                        <div class="config-item global-item">
                          <div class="config-item-info">
                            <div class="config-item-name">🔒 {plugin.name}</div>
                          </div>
                          <span class="badge">enabled</span>
                        </div>
                      )}
                    </For>
                  </div>
                </div>
              </Show>
            </Show>
          </div>
        </Show>
      </div>
    </>
  )
}
