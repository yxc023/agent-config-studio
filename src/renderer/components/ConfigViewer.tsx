import { For, Show, createSignal } from "solid-js"
import type { Workspace, ConfigData } from "../App"
import type { SkillPermission, SkillsDiscovery, AgentsDiscovery, PluginsDiscovery } from "../../preload/types"

interface Props {
  workspace: Workspace
  workspaceConfig: ConfigData | null
  globalConfig: ConfigData | null
  skillsDiscovery: SkillsDiscovery | null
  agentsDiscovery: AgentsDiscovery | null
  pluginsDiscovery: PluginsDiscovery | null
  onToggleAgent: (agentName: string, disabled: boolean) => void
  onUpdateSkillPermission: (skillPattern: string, permission: SkillPermission) => void
  onTogglePlugin: (pluginName: string, enabled: boolean) => void
  onOpenInEditor: (path: string) => void
}

interface AgentItem {
  name: string
  disabled: boolean
  isGlobal: boolean
  hasConfig: boolean
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
    const agentNames = new Set<string>()

    if (cfg?.agent) {
      Object.keys(cfg.agent).forEach((name) => {
        if (name !== "build" && name !== "plan") {
          agentNames.add(name)
        }
      })
    }

    ;(props.agentsDiscovery?.workspace || []).forEach((name) => agentNames.add(name))

    return Array.from(agentNames).sort().map((name) => {
      const agentData = cfg?.agent?.[name] as { disable?: boolean } | undefined
      return {
        name,
        disabled: agentData?.disable ?? true,
        isGlobal: false,
        hasConfig: !!cfg?.agent?.[name],
      }
    })
  }

  const globalAgents = (): AgentItem[] => {
    const cfg = props.globalConfig
    const wsAgentNames = new Set<string>()

    if (props.workspaceConfig?.agent) {
      Object.keys(props.workspaceConfig.agent).forEach((name) => wsAgentNames.add(name))
    }
    ;(props.agentsDiscovery?.workspace || []).forEach((name) => wsAgentNames.add(name))

    const agentNames = new Set<string>()

    if (cfg?.agent) {
      Object.keys(cfg.agent).forEach((name) => {
        if (name !== "build" && name !== "plan" && !wsAgentNames.has(name)) {
          agentNames.add(name)
        }
      })
    }

    ;(props.agentsDiscovery?.global || []).forEach((name) => {
      if (!wsAgentNames.has(name)) {
        agentNames.add(name)
      }
    })

    return Array.from(agentNames).sort().map((name) => {
      const agentData = cfg?.agent?.[name] as { disable?: boolean } | undefined
      return {
        name,
        disabled: agentData?.disable ?? true,
        isGlobal: true,
        hasConfig: !!cfg?.agent?.[name],
      }
    })
  }

  const workspaceSkills = (): SkillItem[] => {
    const cfg = props.workspaceConfig
    const skillNames = props.skillsDiscovery?.workspace || []
    if (!cfg?.permission?.skill) {
      return skillNames.map((name) => ({ name, permission: "allow" as SkillPermission, isGlobal: false }))
    }
    const skillPerms = cfg.permission.skill as Record<string, SkillPermission>
    return skillNames.map((name) => ({
      name,
      permission: skillPerms[name] || "allow",
      isGlobal: false,
    }))
  }

  const globalSkills = (): SkillItem[] => {
    const cfg = props.globalConfig
    const globalSkillNames = props.skillsDiscovery?.global || []
    if (!cfg?.permission?.skill) {
      return globalSkillNames.map((name) => ({ name, permission: "allow" as SkillPermission, isGlobal: true }))
    }
    const skillPerms = cfg.permission.skill as Record<string, SkillPermission>
    return globalSkillNames.map((name) => ({
      name,
      permission: skillPerms[name] || "allow",
      isGlobal: true,
    }))
  }

  const workspacePlugins = (): PluginItem[] => {
    const cfg = props.workspaceConfig
    const pluginNames = new Set<string>()

    ;(cfg?.plugin || []).forEach((name) => pluginNames.add(name))
    ;(props.pluginsDiscovery?.workspace || []).forEach((name) => pluginNames.add(name))

    return Array.from(pluginNames).sort().map((name) => ({
      name,
      enabled: (cfg?.plugin || []).includes(name),
      isGlobal: false,
    }))
  }

  const globalPlugins = (): PluginItem[] => {
    const cfg = props.globalConfig
    const wsPluginNames = new Set<string>()

    ;(props.workspaceConfig?.plugin || []).forEach((name) => wsPluginNames.add(name))
    ;(props.pluginsDiscovery?.workspace || []).forEach((name) => wsPluginNames.add(name))

    const pluginNames = new Set<string>()

    ;(cfg?.plugin || []).forEach((name) => {
      if (!wsPluginNames.has(name)) {
        pluginNames.add(name)
      }
    })
    ;(props.pluginsDiscovery?.global || []).forEach((name) => {
      if (!wsPluginNames.has(name)) {
        pluginNames.add(name)
      }
    })

    return Array.from(pluginNames).sort().map((name) => ({
      name,
      enabled: (cfg?.plugin || []).includes(name),
      isGlobal: true,
    }))
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
                          <Show when={agent.hasConfig} fallback={<span class="badge">undiscovered</span>}>
                            <label class="toggle-switch">
                              <input
                                type="checkbox"
                                checked={!agent.disabled}
                                onChange={(e) => handleAgentToggle(agent.name, !e.currentTarget.checked)}
                              />
                              <span class="toggle-slider"></span>
                            </label>
                          </Show>
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
                          <Show when={agent.hasConfig} fallback={<span class="badge">no config</span>}>
                            <span class="badge">{agent.disabled ? "disabled" : "enabled"}</span>
                          </Show>
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
                          <Show when={plugin.enabled} fallback={
                            <label class="toggle-switch">
                              <input
                                type="checkbox"
                                checked={false}
                                onChange={() => handlePluginToggle(plugin.name, true)}
                              />
                              <span class="toggle-slider"></span>
                            </label>
                          }>
                            <label class="toggle-switch">
                              <input
                                type="checkbox"
                                checked={true}
                                onChange={() => handlePluginToggle(plugin.name, false)}
                              />
                              <span class="toggle-slider"></span>
                            </label>
                          </Show>
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
                          <span class="badge">{plugin.enabled ? "enabled" : "disabled"}</span>
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
