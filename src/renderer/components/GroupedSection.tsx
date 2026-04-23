import { Component, For, Show, createSignal, JSX } from 'solid-js'

interface GroupedSectionProps<T> {
  title: string
  items: T[]
  renderItem: (item: T) => JSX.Element
}

export function GroupedSection<T>(props: GroupedSectionProps<T>): JSX.Element {
  const [collapsed, setCollapsed] = createSignal(false)

  return (
    <div class="grouped-section">
      <div class="section-header" onClick={() => setCollapsed(!collapsed())}>
        <span class={`collapse-icon ${collapsed() ? 'collapsed' : ''}`}>▼</span>
        <span class="section-title">{props.title}</span>
        <span class="section-count">({props.items.length})</span>
      </div>
      <Show when={!collapsed()}>
        <div class="section-items">
          <For each={props.items}>
            {(item) => props.renderItem(item)}
          </For>
        </div>
      </Show>
    </div>
  )
}