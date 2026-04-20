import { type Component, Show } from "solid-js"

interface AgentCardProps {
  name: string
  enabled: boolean
  isGlobal?: boolean
  onToggle: (name: string, enabled: boolean) => void
}

const AgentCard: Component<AgentCardProps> = (props) => {
  const handleClick = () => {
    props.onToggle(props.name, !props.enabled)
  }

  return (
    <div
      class={`card rounded-2xl p-4 shadow-sm cursor-pointer border border-[#e5e5e5] ${!props.enabled ? "opacity-50" : ""} ${props.isGlobal ? "bg-gray-50" : "bg-white"}`}
      style={{ height: "72px" }}
      onClick={handleClick}
    >
      <div class="flex items-center justify-between h-full">
        <div class="flex items-center gap-3">
          <div
            class={`w-2 h-2 rounded-full ${props.enabled ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[#d1d5db]"}`}
          />
          <span class={`font-medium text-sm ${!props.enabled ? "text-[#6b7280]" : ""}`}>
            {props.name}
          </span>
          <Show when={props.isGlobal}>
            <span class="text-xs text-[#86868b] bg-gray-200 px-1.5 py-0.5 rounded">Global</span>
          </Show>
        </div>
        <span
          class={`text-xs font-medium ${props.enabled ? "text-[#22c55e]" : "text-[#9ca3af]"}`}
        >
          {props.enabled ? "Enabled" : "Disabled"}
        </span>
      </div>
    </div>
  )
}

export default AgentCard