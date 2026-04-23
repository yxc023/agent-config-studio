import { type Component, For, Show, createMemo } from "solid-js"
import type { TabType } from "./TabBar"
import type { AgentItem, SkillItem } from "../../preload/types"
import AgentCard from "./AgentCard"
import SkillCard from "./SkillCard"
import PluginCard from "./PluginCard"
import { GroupedSection } from "./GroupedSection"
import { ViewToggle } from "./ViewToggle"

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
  onToggleAgent: (name: string) => void
  onToggleSkill: (fullPath: string) => void
  onTogglePlugin: (name: string, enabled: boolean, isGlobal: boolean) => void
  onViewModeChange: (mode: "compact" | "detailed") => void
}

const CardGrid: Component<CardGridProps> = (props) => {
  const groupedAgents = createMemo(() => {
    const groups: Record<string, AgentItem[]> = {}
    for (const agent of props.agents) {
      const dir = agent.directory || "root"
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(agent)
    }
    return groups
  })

  const groupedSkills = createMemo(() => {
    const groups: Record<string, SkillItem[]> = {}
    for (const skill of props.skills) {
      const dir = skill.directory || "root"
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(skill)
    }
    return groups
  })

  return (
    <div class="flex-1 overflow-y-auto p-8 bg-[#f5f5f7]">
      <div class="mb-4">
        <ViewToggle mode={props.viewMode} onChange={props.onViewModeChange} />
      </div>

      <Show when={props.activeTab === "agents"}>
        <For each={Object.entries(groupedAgents())}>
          {([directory, agents]) => (
            <GroupedSection
              title={directory}
              items={agents}
              renderItem={(agent) => (
                <div style={{ width: "280px", "flex-shrink": 0 }}>
                  <AgentCard
                    agent={agent}
                    viewMode={props.viewMode}
                    onToggle={props.onToggleAgent}
                  />
                </div>
              )}
            />
          )}
        </For>
      </Show>

      <Show when={props.activeTab === "skills"}>
        <For each={Object.entries(groupedSkills())}>
          {([directory, skills]) => (
            <GroupedSection
              title={directory}
              items={skills}
              renderItem={(skill) => (
                <div style={{ width: "280px", "flex-shrink": 0 }}>
                  <SkillCard
                    skill={skill}
                    viewMode={props.viewMode}
                    onToggle={props.onToggleSkill}
                  />
                </div>
              )}
            />
          )}
        </For>
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