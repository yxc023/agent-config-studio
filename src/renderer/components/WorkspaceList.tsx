import { For, Show } from "solid-js"
import type { Workspace } from "../App"

interface Props {
  workspaces: Workspace[]
  selected: Workspace | null
  onSelect: (w: Workspace) => void
  onRemove: (id: string) => void
}

export default function WorkspaceList(props: Props) {
  return (
    <Show when={props.workspaces.length > 0} fallback={<div class="empty-message">No workspaces added</div>}>
      <For each={props.workspaces}>
        {(workspace) => (
          <div
            class="list-item"
            classList={{ active: props.selected?.id === workspace.id }}
            onClick={() => props.onSelect(workspace)}
          >
            <div class="list-item-icon">📁</div>
            <div class="list-item-content">
              <div class="list-item-name">{workspace.name}</div>
              <div class="list-item-path">{workspace.path}</div>
            </div>
            <button
              class="button button-danger button-small"
              onClick={(e) => {
                e.stopPropagation()
                props.onRemove(workspace.id)
              }}
            >
              ×
            </button>
          </div>
        )}
      </For>
    </Show>
  )
}
