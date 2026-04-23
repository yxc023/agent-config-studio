import { type Component, For, Show } from "solid-js"
import type { TabType } from "./TabBar"
import type { AgentItem, SkillItem } from "../../preload/types"
import AgentCard from "./AgentCard"
import SkillCard from "./SkillCard"
import PluginCard from "./PluginCard"

interface PluginItem {
  name: string
  enabled: boolean
  isGlobal: boolean
}

interface CardGridProps {
  activeTab: TabType
  viewMode: "compact" | "detailed"
  agents: AgentItem[]
  skills: SkillItem[]
  plugins: PluginItem[]
  onToggleAgent: (name: string, enabled: boolean, isGlobal: boolean) => void
  onToggleSkill: (fullPath: string) => void
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
                  agent={agent}
                  viewMode={props.viewMode}
                  onToggle={(fullPath) => props.onToggleAgent(fullPath, agent.enabled, agent.isGlobal)}
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
                  skill={skill}
                  viewMode={props.viewMode}
                  onToggle={props.onToggleSkill}
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