import { type Component, Show } from "solid-js"
import { Tooltip } from "./Tooltip"
import type { SkillItem } from "../../preload/types"

interface SkillCardProps {
  skill: SkillItem
  viewMode: "compact" | "detailed"
  onToggle: (name: string) => void
}

const SkillCard: Component<SkillCardProps> = (props) => {
  const isAllow = () => props.skill.permission === "allow"

  const tooltipContent = () => (
    <div class="tooltip-info">
      <Show when={props.skill.directory !== "root"}>
        <div class="tooltip-directory">{props.skill.directory}/</div>
      </Show>
      <Show when={props.skill.description}>
        <div class="tooltip-description">{props.skill.description}</div>
      </Show>
      <Show when={props.skill.isGlobal}>
        <span class="badge global">Global</span>
      </Show>
    </div>
  )

  return (
    <Tooltip content={tooltipContent()}>
      <div
        class={`skill-card ${props.viewMode} ${isAllow() ? "border-2 border-[#22c55e]" : "border-2 border-[#ef4444] opacity-70"} ${props.skill.isGlobal ? "bg-gray-50" : "bg-white"}`}
        onClick={() => props.onToggle(props.skill.fullPath)}
      >
        <div class="flex items-center justify-between h-full">
          <div class="flex items-center gap-2">
            <div
              class={`w-2 h-2 rounded-full ${isAllow() ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
            />
            <span class={`font-medium text-sm ${!isAllow() ? "text-[#dc2626]" : ""}`}>
              {props.skill.name}
            </span>
            <Show when={props.skill.isGlobal}>
              <span class="text-xs text-[#86868b] bg-gray-200 px-1.5 py-0.5 rounded">Global</span>
            </Show>
          </div>
          <Show when={props.viewMode === "detailed"}>
            <span class={`text-xs font-medium ${isAllow() ? "text-[#22c55e]" : "text-[#ef4444]"}`}>
              {isAllow() ? "Allow" : "Deny"}
            </span>
          </Show>
        </div>
      </div>
    </Tooltip>
  )
}

export default SkillCard