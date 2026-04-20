import { For, Show } from "solid-js"
import type { Profile } from "../App"

interface Props {
  profiles: Profile[]
  selected: Profile | null
  onSelect: (p: Profile) => void
  onDelete: (p: Profile) => void
  onCreateFromWorkspace: () => void
  onCreateBlank: () => void
  hasSelectedWorkspace: boolean
}

export default function ProfileList(props: Props) {
  return (
    <div>
      <div class="actions-row">
        <button
          class="button button-secondary button-small"
          onClick={props.onCreateFromWorkspace}
          disabled={!props.hasSelectedWorkspace}
          title={props.hasSelectedWorkspace ? "Create from current workspace" : "Select a workspace first"}
        >
          From WS
        </button>
        <button class="button button-secondary button-small" onClick={props.onCreateBlank}>
          Blank
        </button>
      </div>
      <Show when={props.profiles.length > 0} fallback={<div class="empty-message">No profiles yet</div>}>
        <For each={props.profiles}>
          {(profile) => (
            <div
              class="list-item"
              classList={{ active: props.selected?.id === profile.id }}
              onClick={() => props.onSelect(profile)}
            >
              <div class="list-item-icon">📋</div>
              <div class="list-item-content">
                <div class="list-item-name">{profile.name}</div>
              </div>
              <button
                class="button button-danger button-small"
                onClick={(e) => {
                  e.stopPropagation()
                  props.onDelete(profile)
                }}
              >
                ×
              </button>
            </div>
          )}
        </For>
      </Show>
    </div>
  )
}
