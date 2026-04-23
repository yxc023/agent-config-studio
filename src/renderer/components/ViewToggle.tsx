import { Component } from 'solid-js'

interface ViewToggleProps {
  mode: "compact" | "detailed"
  onChange: (mode: "compact" | "detailed") => void
}

export const ViewToggle: Component<ViewToggleProps> = (props) => {
  return (
    <div class="view-toggle">
      <button
        class={props.mode === "compact" ? "active" : ""}
        onClick={() => props.onChange("compact")}
      >
        Compact
      </button>
      <button
        class={props.mode === "detailed" ? "active" : ""}
        onClick={() => props.onChange("detailed")}
      >
        Detailed
      </button>
    </div>
  )
}