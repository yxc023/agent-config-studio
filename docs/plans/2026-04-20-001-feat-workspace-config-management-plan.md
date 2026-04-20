---
title: "feat: Enhance workspace config management"
type: feat
status: active
date: 2026-04-20
origin: docs/brainstorms/2026-04-20-workspace-config-management-requirements.md
---

# Enhance Workspace Config Management

## Overview

Add visual management of opencode agents, skills, and plugins with workspace/global scope separation. Users can toggle agents, change skill permissions, and enable/disable plugins directly in workspace configs. New workspaces can be initialized from a deny-by-default template.

## Problem Frame

Users need to visually manage opencode workspace configurations including enabling/disabling agents, skills, and plugins. The app must show how global configurations affect the current workspace while only allowing edits to workspace-local settings.

## Requirements Trace

- R1. Workspace header displays name and path
- R2. Load workspace local `opencode.jsonc`
- R3. Read global config for effective configuration
- R4. Offer initialization when workspace has no config
- R5-R7. Default template disables all agents/skills/plugins
- R9-R15. Agents displayed in two groups with toggle controls
- R16-R21. Skills displayed in two groups with permission dropdowns
- R22-R27. Plugins displayed in two groups with toggle controls
- R28-R31. Direct save on change with toast/banner feedback
- R32-R34. Workspace initialization from template
- R35-R46. UI layout and visual design

## Scope Boundaries

- Does NOT edit global configs
- Does NOT modify skills/plugin source files, only config references
- Does NOT provide agent creation/editing (only enable/disable)

## Key Technical Decisions

- **Deny-by-default template**: All agents/skills/plugins start disabled
- **Direct save on toggle**: No staging area or explicit save
- **Permission-based skills**: Skills use `permission.skill` with `allow`/`ask`/`deny`
- **D1: Template is fixed built-in** at `resources/default-template.jsonc`
- **D2: Skills discovered via filesystem** scanning `.opencode/skills/`, `.claude/skills/`, `.agents/skills/`
- **D3: Agent conflict resolution**: Workspace config takes precedence

## Context & Research

### Relevant Code and Patterns

- `src/main/ipc.ts` — IPC handler registration pattern (142 lines)
- `src/main/fileOps.ts` — Config read/write, `findOpencodeConfig()`, JSONC parsing
- `src/main/jsonc.ts` — JSONC merge/diff utilities
- `src/main/constants.ts` — `PROFILES_DIR` path construction with `homedir()`
- `src/preload/types.ts` — `ElectronAPI` interface and `ConfigData`
- `src/renderer/App.tsx` — Main state owner with signal pattern
- `src/renderer/components/ConfigViewer.tsx` — Current config display (will be rewritten)
- `src/renderer/styles.css` — Dark theme CSS variables

### Existing Patterns to Follow

- IPC: `ipcMain.handle("channel", async (...args) => {...})` + `ipcRenderer.invoke("channel", ...args)`
- Error handling: `try/catch` with `setError()` + `setTimeout()` auto-clear
- SolidJS: `createSignal`, `Show`, `For`, `onMount`, `classList`
- Config: JSONC via `jsonc-parser`, `parseJsonc()` + `editJsonc()`

## Open Questions

### Resolved During Planning

- **Template is fixed built-in** — Bundle `resources/default-template.jsonc` with app
- **Skills discovery** — Use `fs.readdir` with recursive scan for `SKILL.md` files
- **Agent conflict** — Workspace-defined agents show in Workspace group only

### Deferred to Implementation

- Exact UI component breakdown (may split into smaller components during implementation)
- Debouncing rapid toggle changes (implement if UX feedback indicates need)

## Implementation Units

- [x] **Unit 1: Create default template file**

**Goal:** Create the built-in deny-by-default template

**Requirements:** R5, R6, R7, R8

**Dependencies:** None

**Files:**
- Create: `resources/default-template.jsonc`

**Approach:**
Template structure:
```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "agent": {
    "build": { "disable": true },
    "plan": { "disable": true }
  },
  "permission": {
    "skill": { "*": "deny" }
  }
}
```

**Patterns to follow:** Standard JSONC format with `$schema`

**Test scenarios:**
- Verify template parses as valid JSONC
- Verify agents have `disable: true`
- Verify skill permission defaults to `deny`

**Verification:**
- Template file exists at `resources/default-template.jsonc`
- File is included in app bundle (verify in build output)

---

- [x] **Unit 2: Add global config and skills discovery IPC handlers**

**Goal:** Add IPC handlers for global config reading and skills filesystem discovery

**Requirements:** R3, R20, R21

**Dependencies:** None

**Files:**
- Modify: `src/main/fileOps.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/main/constants.ts`
- Modify: `src/preload/types.ts`
- Modify: `src/preload/index.ts`

**Approach:**

1. Add to `constants.ts`:
   - `GLOBAL_CONFIG_DIR` — `~/.config/opencode` (macOS/Linux)
   - `GLOBAL_CONFIG_FILE` — `opencode.jsonc`
   - `SKILL_SEARCH_DIRS` — `[".opencode/skills", ".claude/skills", ".agents/skills"]`

2. Add to `fileOps.ts`:
   - `getGlobalConfigPath()` — returns `GLOBAL_CONFIG_DIR + GLOBAL_CONFIG_FILE`
   - `readGlobalConfig()` — reads global config if exists
   - `discoverSkills(dirPath: string)` — scans skill directories, returns skill names array
   - Traverse up from workspace to find git root, then scan skill dirs

3. Add IPC handlers:
   - `global-config-read` — returns global config or null
   - `skills-discover` — takes workspace path, returns `{ workspace: string[], global: string[] }`

4. Add types:
   ```typescript
   interface SkillsDiscovery {
     workspace: string[]
     global: string[]
   }
   ```

**Patterns to follow:**
- Error handling: return `null` if file doesn't exist
- Use `os.homedir()` for path construction

**Test scenarios:**
- Happy path: Returns global config when exists
- Edge case: Returns null when global config doesn't exist
- Edge case: Skills discovered from nested directories correctly

**Verification:**
- IPC handlers respond correctly with mock calls
- Skills discovery returns skill names from test directories

---

- [x] **Unit 3: Add workspace initialization IPC handler**

**Goal:** Add handler to initialize workspace from default template

**Requirements:** R32, R33, R34

**Dependencies:** Unit 1

**Files:**
- Modify: `src/main/ipc.ts`
- Modify: `src/preload/types.ts`
- Modify: `src/preload/index.ts`

**Approach:**

1. Add IPC handler `workspace-initialize`:
   - Takes workspace path
   - Reads `resources/default-template.jsonc` from app bundle
   - Writes to `workspacePath/opencode.jsonc`
   - Returns `{ configPath: string, config: ConfigData }`

2. Add to preload types:
   ```typescript
   workspaceInitialize: (workspacePath: string) => Promise<{ configPath: string; config: ConfigData }>
   ```

**Patterns to follow:**
- Use `app.getAppPath()` to locate bundle resources
- Use existing `writeConfig()` pattern

**Test scenarios:**
- Happy path: Creates config file from template
- Edge case: Fails if workspace already has config (return error)

**Verification:**
- New workspace shows initialized config after calling handler

---

- [x] **Unit 4: Add config update IPC handlers**

**Goal:** Add handlers to toggle agents, update skill permissions, toggle plugins

**Requirements:** R15, R18, R25, R27, R28, R29

**Dependencies:** None

**Files:**
- Modify: `src/main/ipc.ts`
- Modify: `src/main/fileOps.ts`
- Modify: `src/preload/types.ts`
- Modify: `src/preload/index.ts`

**Approach:**

1. Add handlers:
   - `config-toggle-agent` — `(configPath: string, agentName: string, disabled: boolean) => void`
   - `config-update-skill-permission` — `(configPath: string, skillPattern: string, permission: "allow" | "ask" | "deny") => void`
   - `config-toggle-plugin` — `(configPath: string, pluginName: string, enabled: boolean) => void`
     - `enabled: true` → add to `plugin` array if not present
     - `enabled: false` → remove from `plugin` array

2. Each handler:
   - Reads current config
   - Modifies only the relevant section
   - Writes back using `writeConfig()`

**Patterns to follow:**
- Use existing `readConfig()` + `writeConfig()` pattern
- Preserve other config sections unchanged

**Test scenarios:**
- Happy path: Toggle agent writes correct `disable` value
- Edge case: Multiple agents toggled in sequence
- Error path: Fails gracefully if config file is corrupted

**Verification:**
- Toggling agent in UI updates config file immediately
- Skill permission change writes correct `permission.skill` value
- Plugin enable/disable adds/removes from array correctly

---

- [x] **Unit 5: Rewrite ConfigViewer component with Agents/Skills/Plugins sections**

**Goal:** Replace current ConfigViewer with new UI showing Agents, Skills, Plugins sections

**Requirements:** R9-R15, R16-R21, R22-R27, R35-R40

**Dependencies:** Units 2, 3, 4

**Files:**
- Modify: `src/renderer/components/ConfigViewer.tsx`
- Modify: `src/renderer/styles.css`

**Approach:**

1. New state structure:
   ```typescript
   interface WorkspaceItems {
     agents: { name: string; disabled: boolean }[]
     skills: { name: string; permission: "allow" | "ask" | "deny" }[]
     plugins: { name: string; enabled: boolean }[]
   }
   interface GlobalItems {
     agents: { name: string; disabled: boolean }[]
     skills: { name: string; permission: "allow" | "ask" | "deny" }[]
     plugins: { name: string }[]
   }
   ```

2. Load on workspace selection:
   - Read workspace config + global config
   - Discover skills from filesystem
   - Merge into workspace vs global groups

3. UI sections (each collapsible):
   - **Agents**: Toggle switch per workspace agent; lock icon per global agent
   - **Skills**: Permission dropdown per workspace skill; lock icon per global skill
   - **Plugins**: Toggle switch per workspace plugin; lock icon per global plugin

4. Sub-groups within each section:
   - "Workspace" header (editable count)
   - "Global (Read-only)" header with muted styling

**Patterns to follow:**
- Use `Show`, `For` from solid-js
- Use `classList` for conditional styling
- Collapsed state via `createSignal<boolean>`

**Test scenarios:**
- Happy path: All three sections display with correct groupings
- Edge case: Empty workspace (no local config) shows global items only
- Edge case: No global config shows workspace items only
- Edge case: Workspace has no skills directories

**Verification:**
- Selecting workspace loads and displays agents/skills/plugins
- Workspace vs Global items are visually distinct

---

- [x] **Unit 6: Add workspace initialization UI flow**

**Goal:** Prompt user to initialize when adding workspace without config

**Requirements:** R4, R32, R33

**Dependencies:** Units 1, 3

**Files:**
- Modify: `src/renderer/App.tsx`

**Approach:**

1. In `handleAddWorkspace()`:
   - After selecting directory, check if `opencode.jsonc` exists
   - If not, show confirmation dialog: "Initialize workspace with default config?"
   - If confirmed, call `workspaceInitialize()` IPC
   - If declined, still add workspace but show empty state

2. Add UI:
   - Use native `window.confirm()` for simplicity
   - Or create a simple modal component for better UX

**Patterns to follow:**
- Use existing `handleAddWorkspace()` pattern
- Error handling with `setError()` + toast

**Test scenarios:**
- Happy path: Workspace initializes and shows template config
- Edge case: User declines initialization

**Verification:**
- Adding workspace without config prompts initialization dialog
- Accepting creates `opencode.jsonc` with template content

---

- [x] **Unit 7: Add toast notifications and error handling**

**Goal:** Add success toast and error banner for config changes

**Requirements:** R30, R31

**Dependencies:** Unit 5

**Files:**
- Modify: `src/renderer/App.tsx`
- Modify: `src/renderer/styles.css`

**Approach:**

1. Add toast signal:
   ```typescript
   const [toast, setToast] = createSignal<string | null>(null)
   ```

2. Auto-dismiss on success:
   ```typescript
   setToast("Config saved")
   setTimeout(() => setToast(null), 2000)
   ```

3. Existing error banner already handles errors (R31)

**Patterns to follow:**
- Use existing error banner styling (`.error-banner`)
- Toast styling similar to error banner but with success color

**Test scenarios:**
- Happy path: Toggle save shows success toast
- Error path: Save failure shows error banner

**Verification:**
- Toast appears for 2 seconds then disappears
- Error banner appears and auto-dismisses after 3 seconds

---

- [x] **Unit 8: Add collapsible section state management**

**Goal:** Sections remember expanded/collapsed state during session

**Requirements:** R46

**Dependencies:** Unit 5

**Files:**
- Modify: `src/renderer/components/ConfigViewer.tsx`

**Approach:**

1. Add signals for each section:
   ```typescript
   const [agentsExpanded, setAgentsExpanded] = createSignal(true)
   const [skillsExpanded, setSkillsExpanded] = createSignal(true)
   const [pluginsExpanded, setPluginsExpanded] = createSignal(true)
   ```

2. Chevron icon rotates based on state
3. State is session-only (not persisted)

**Patterns to follow:**
- Use CSS rotation transform for chevron
- `Show` component for conditional rendering

**Test scenarios:**
- Collapse agents section, collapse and expand skills section, agents stays collapsed

**Verification:**
- Collapsed state persists during session
- State resets on app restart

---

- [x] **Unit 9: UI polish and visual refinements**

**Goal:** Apply visual design from requirements (R41-R45)

**Requirements:** R39, R42, R43, R44, R45

**Dependencies:** Unit 5

**Files:**
- Modify: `src/renderer/styles.css`

**Approach:**

1. Global items styling:
   ```css
   .global-item {
     opacity: 0.6;
     color: var(--text-muted); /* #666666 */
   }
   .global-item::before {
     content: "🔒 ";
   }
   ```

2. Section headers:
   ```css
   .section-header {
     font-size: 10px;
     font-weight: 600;
     text-transform: uppercase;
     letter-spacing: 0.05em;
     color: var(--text-muted);
   }
   ```

3. Toggle styling (use native checkbox or styled div):
   ```css
   .toggle {
     accent-color: var(--accent); /* #0a84ff */
   }
   ```

**Patterns to follow:**
- Use existing CSS variables from styles.css
- Dark theme matching current aesthetic

**Test scenarios:**
- Global items show lock icon and muted color
- Section headers uppercase with letter-spacing
- Toggles use accent color when enabled

**Verification:**
- Visual inspection matches requirements spec

## System-Wide Impact

- **Interaction graph:** ConfigViewer now loads global config and skills discovery — no other components affected
- **Error propagation:** IPC errors propagate to UI via existing error banner
- **State lifecycle:** New signals in ConfigViewer for expanded/collapsed state

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| Skills discovery is slow on large directories | Deferred: scan only after workspace selection, consider async with loading state |
| Config file corruption during write | Use atomic write pattern (write to temp, then rename) — deferred to follow-up |
| Rapid toggle changes cause race conditions | Deferred: add debounce if UX feedback indicates need |

## Documentation / Operational Notes

- Template file must be included in app bundle (verify in `electron-builder.config.ts` or `package.json` build config)

## Sources & References

- **Origin document:** [docs/brainstorms/2026-04-20-workspace-config-management-requirements.md](../brainstorms/2026-04-20-workspace-config-management-requirements.md)
- IPC patterns: `src/main/ipc.ts`
- Config handling: `src/main/fileOps.ts`
- SolidJS components: `src/renderer/components/ConfigViewer.tsx`
