import { createSignal, For } from "solid-js"
import type { MergePreview } from "../App"

interface Props {
  preview: MergePreview
  onApply: (sections: string[]) => void
  onCancel: () => void
}

export default function DiffModal(props: Props) {
  const [selectedSections, setSelectedSections] = createSignal<string[]>(["full"])

  function toggleSection(section: string) {
    const current = selectedSections()
    if (section === "full") {
      setSelectedSections(["full"])
    } else {
      const withoutFull = current.filter((s) => s !== "full")
      if (withoutFull.includes(section)) {
        setSelectedSections(withoutFull.filter((s) => s !== section))
      } else {
        setSelectedSections([...withoutFull, section])
      }
    }
  }

  function isSelected(section: string) {
    return selectedSections().includes(section)
  }

  return (
    <div class="modal-overlay" onClick={props.onCancel}>
      <div class="modal" onClick={(e) => e.stopPropagation()}>
        <div class="modal-title">Apply Profile</div>
        <div class="modal-body">
          <div class="diff-preview">
            <For each={props.preview.diff}>
              {(line) => <div class="diff-line">{line}</div>}
            </For>
          </div>

          <div class="form-group" style={{ "margin-top": "16px" }}>
            <div class="form-label">Sections to merge:</div>
            <div class="checkbox-group">
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={isSelected("full")}
                  onChange={() => toggleSection("full")}
                />
                <span>Full config (replace all)</span>
              </label>
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={isSelected("agents")}
                  onChange={() => toggleSection("agents")}
                />
                <span>Agents only (merge with existing)</span>
              </label>
              <label class="checkbox-item">
                <input
                  type="checkbox"
                  checked={isSelected("plugins")}
                  onChange={() => toggleSection("plugins")}
                />
                <span>Plugins only (merge with existing)</span>
              </label>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="button button-secondary" onClick={props.onCancel}>
            Cancel
          </button>
          <button
            class="button button-primary"
            onClick={() => props.onApply(selectedSections())}
            disabled={selectedSections().length === 0}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}
