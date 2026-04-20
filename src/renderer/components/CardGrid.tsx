import { type Component, For, Show } from "solid-js"
import type { TabType } from "./TabBar"
import AgentCard from "./AgentCard"
import SkillCard from "./SkillCard"
import PluginCard from "./PluginCard"

interface AgentItem {
  name: string
  enabled: boolean
  isGlobal: boolean
}

interface SkillItem {
  name: string
  permission: "allow" | "deny"
  ask: boolean
  isGlobal: boolean
}

interface PluginItem {
  name: string
  enabled: boolean
  isGlobal: boolean
}

interface CardGridProps {
  activeTab: TabType
  agents: AgentItem[]
  skills: SkillItem[]
  plugins: PluginItem[]
  onToggleAgent: (name: string, enabled: boolean, isGlobal: boolean) => void
  onUpdateSkillPermission: (name: string, permission: "allow" | "deny", isGlobal: boolean) => void
  onAskChange: (name: string, ask: boolean, isGlobal: boolean) => void
  onTogglePlugin: (name: string, enabled: boolean, isGlobal: boolean) => void
}

const CardGrid: Component<CardGridProps> = (props) => {
  return (
    <div class="flex-1 overflow-y-auto p-8 bg-[#f5f5f7]">
      <Show when={props.activeTab === "agents"}>
        <div class="flex flex-wrap gap-4">
          <For each={props.agents}>
            {(agent) => (
              <div style={{ width: "280px", "flex-shrink": 0 }}>
                <AgentCard
                  name={agent.name}
                  enabled={agent.enabled}
                  isGlobal={agent.isGlobal}
                  onToggle={(name, enabled) => props.onToggleAgent(name, enabled, agent.isGlobal)}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.activeTab === "skills"}>
        <div class="flex flex-wrap gap-4">
          <For each={props.skills}>
            {(skill) => (
              <div style={{ width: "280px", "flex-shrink": 0 }}>
                <SkillCard
                  name={skill.name}
                  permission={skill.permission}
                  ask={skill.ask}
                  isGlobal={skill.isGlobal}
                  onPermissionChange={(name, perm) => props.onUpdateSkillPermission(name, perm, skill.isGlobal)}
                  onAskChange={(name, ask) => props.onAskChange(name, ask, skill.isGlobal)}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
      <Show when={props.activeTab === "plugins"}>
        <div class="flex flex-wrap gap-4">
          <For each={props.plugins}>
            {(plugin) => (
              <div style={{ width: "280px", "flex-shrink": 0 }}>
                <PluginCard
                  name={plugin.name}
                  enabled={plugin.enabled}
                  isGlobal={plugin.isGlobal}
                  onToggle={(name, enabled) => props.onTogglePlugin(name, enabled, plugin.isGlobal)}
                />
              </div>
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}

export default CardGrid