import { type Component, Show } from "solid-js"

interface SkillCardProps {
  name: string
  permission: "allow" | "deny"
  ask: boolean
  isGlobal?: boolean
  onPermissionChange: (name: string, permission: "allow" | "deny") => void
  onAskChange: (name: string, ask: boolean) => void
}

const SkillCard: Component<SkillCardProps> = (props) => {
  const isAllow = () => props.permission === "allow"

  const handleCardClick = () => {
    const newPermission = isAllow() ? "deny" : "allow"
    props.onPermissionChange(props.name, newPermission)
  }

  const handleAskClick = (e: MouseEvent) => {
    e.stopPropagation()
    props.onAskChange(props.name, !props.ask)
  }

  return (
    <div
      class={`card rounded-2xl p-4 shadow-sm cursor-pointer ${isAllow() ? "border-2 border-[#22c55e]" : "border-2 border-[#ef4444] opacity-70"} ${props.isGlobal ? "bg-gray-50" : "bg-white"}`}
      style={{ height: "88px" }}
      onClick={handleCardClick}
    >
      <div class="flex flex-col justify-between h-full">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <div
              class={`w-2 h-2 rounded-full ${isAllow() ? "bg-[#22c55e] shadow-[0_0_8px_rgba(34,197,94,0.5)]" : "bg-[#ef4444] shadow-[0_0_8px_rgba(239,68,68,0.5)]"}`}
            />
            <span class={`font-medium text-sm ${!isAllow() ? "text-[#dc2626]" : ""}`}>
              {props.name}
            </span>
            <Show when={props.isGlobal}>
              <span class="text-xs text-[#86868b] bg-gray-200 px-1.5 py-0.5 rounded">Global</span>
            </Show>
          </div>
          <span
            class={`text-xs font-medium ${isAllow() ? "text-[#22c55e]" : "text-[#ef4444]"}`}
          >
            {isAllow() ? "Allow" : "Deny"}
          </span>
        </div>
        <Show when={isAllow()}>
          <label
            class={`flex items-center gap-1.5 text-xs cursor-pointer transition-colors ${props.ask ? "text-[#6b7280]" : "text-[#9ca3af]"}`}
            onClick={handleAskClick}
          >
            <input
              type="checkbox"
              checked={props.ask}
              class="w-3 h-3 rounded border-[#d1d5db] text-[#22c55e] focus:ring-[#22c55e]"
            />
            <span>Ask before using</span>
          </label>
        </Show>
      </div>
    </div>
  )
}

export default SkillCard