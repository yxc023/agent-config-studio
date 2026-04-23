import { type Component, Show } from "solid-js"
import { Tooltip } from "./Tooltip"
import type { AgentItem } from "../../preload/types"

interface AgentCardProps {
  agent: AgentItem
  viewMode: "compact" | "detailed"
  onToggle: (name: string) => void
}

const AgentCard: Component<AgentCardProps> = (props) => {
  const tooltipContent = () => (
    <div class="tooltip-info">
      <Show when={props.agent.directory !== "root"}>
        <div class="tooltip-directory">{props.agent.directory}/</div>
      </Show>
      <Show when={props.agent.description}>
        <div class="tooltip-description">{props.agent.description}</div>
      </Show>
      <Show when={props.agent.isGlobal}>
        <span class="badge global">Global</span>
      </Show>
    </div>
  )

  return (
    <Tooltip content={tooltipContent()}>
      <div
        class={`agent-card ${props.viewMode} ${!props.agent.enabled ? "opacity-50" : ""} ${props.agent.isGlobal ? "bg-gray-50" : "bg-white"}`}
        onClick={() => props.onToggle(props.agent.fullPath)}
      >
        <div class="flex items-center gap-3">
          <div
            class={`w-2 h-2 rounded-full ${props.agent.enabled ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[#d1d5db]"}`}
          />
          <span class={`font-medium text-sm ${!props.agent.enabled ? "text-[#6b7280]" : ""}`}>
            {props.agent.name}
          </span>
          <Show when={props.agent.isGlobal}>
            <span class="text-xs text-[#86868b] bg-gray-200 px-1.5 py-0.5 rounded">Global</span>
          </Show>
        </div>
        <Show when={props.viewMode === "detailed"}>
          <Show when={props.agent.directory !== "root"}>
            <div class="text-xs text-[#86868b] mt-1">{props.agent.directory}/</div>
          </Show>
          <Show when={props.agent.description}>
            <div class="text-xs text-[#6b7280] mt-1">{props.agent.description}</div>
          </Show>
        </Show>
      </div>
    </Tooltip>
  )
}

export default AgentCard