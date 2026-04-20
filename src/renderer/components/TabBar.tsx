import { type Component } from "solid-js"
import { createSignal } from "solid-js"

export type TabType = "agents" | "skills" | "plugins"

interface TabBarProps {
  activeTab: TabType
  onChange: (tab: TabType) => void
}

const TabBar: Component<TabBarProps> = (props) => {
  return (
    <div class="h-14 bg-white border-b border-[#e5e5e5] flex items-center px-6">
      <button
        id="tab-agents"
        class={`tab-btn px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 mr-2 ${props.activeTab === "agents" ? "tab-active" : "tab-inactive"}`}
        onClick={() => props.onChange("agents")}
      >
        <span>🤖</span><span>Agents</span>
      </button>
      <button
        id="tab-skills"
        class={`tab-btn px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 mr-2 ${props.activeTab === "skills" ? "tab-active" : "tab-inactive"}`}
        onClick={() => props.onChange("skills")}
      >
        <span>⚡</span><span>Skills</span>
      </button>
      <button
        id="tab-plugins"
        class={`tab-btn px-5 py-2.5 text-sm rounded-lg flex items-center gap-2 ${props.activeTab === "plugins" ? "tab-active" : "tab-inactive"}`}
        onClick={() => props.onChange("plugins")}
      >
        <span>🔌</span><span>Plugins</span>
      </button>
    </div>
  )
}

export default TabBar