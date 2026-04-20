---
title: feat: OpenCode Workspace Config Manager
type: feat
status: active
date: 2026-04-20
origin: docs/brainstorms/2026-04-20-opencode-workspace-config-manager-requirements.md
---

# OpenCode Workspace Config Manager

## Overview

A standalone Electron desktop app that serves as a GUI for managing opencode.jsonc configurations across multiple workspaces. Provides reusable configuration profiles and quick toggling of agents/plugins without manual JSON editing.

## Problem Frame

OpenCode's agents, skills, and plugins can be installed globally (~/.config/opencode/) or per-project (.opencode/). Global installation creates clutter when not all projects need every agent. Per-project installation requires duplicating configuration for each new workspace. This app provides a middle ground: reusable configuration profiles that can be applied to any workspace with one click, plus quick toggling of individual components.

## Requirements Trace

- R1. User can manually add a workspace directory containing opencode.json/opencode.jsonc
- R2. User can remove a workspace from the app
- R3. App displays list of added workspaces with name and path
- R4. User can select a workspace to view its opencode.jsonc configuration
- R5. User can create a new profile from an existing workspace's opencode.jsonc
- R6. User can create a new blank profile with minimal opencode.jsonc structure
- R7. Profiles are stored as opencode.jsonc files in ~/.config/opencode-manager/profiles/
- R8. User can delete a profile
- R9. User can rename a profile
- R10. User can apply a profile to a workspace
- R11. Before applying, app shows diff preview of current vs incoming configuration
- R12. User selects sections to merge: agents, plugins, or full config. Non-selected sections preserved.
- R13. User can enable/disable individual agents via toggle UI
- R14. User can enable/disable individual plugins via toggle UI
- R15. User can add/remove agents from opencode.jsonc via the app
- R16. User can add/remove plugins from opencode.jsonc via the app
- R17. App displays which skills are referenced and where they are located
- R18. App does not directly edit skill files
- R19. User can open workspace's opencode.jsonc in external editor
- R20. User can open profile in external editor

## Scope Boundaries

- This app does NOT launch opencode sessions
- This app does NOT manage global opencode installation (agents, skills in ~/.config/opencode/)
- This app does NOT sync profiles to remote servers or share with teammates
- This app does NOT manage .opencode/agents/ markdown files directly (only agent references in opencode.jsonc)

## Context & Research

### Relevant Code and Patterns

**opencode desktop-electron architecture** (from `/Users/michael/develop/github/opencode/packages/desktop-electron/`):
- Electron 41.2.1 with electron-vite for build tooling
- SolidJS for UI (rendered via @opencode-ai/app package)
- TypeScript throughout
- IPC pattern: main process handlers in `ipc.ts`, preload exposes via `contextBridge.exposeInMainWorld("api", api)`
- electron-store for persistent key-value storage
- electron-window-state for window position persistence
- electron-log for logging with rotation

**Config parsing infrastructure** (from opencode/packages/opencode/src/config/):
- `jsonc-parser` for JSONC parsing (handles comments/trailing commas)
- `ConfigParse.jsonc(text, filepath)` for parsing with error reporting
- `ConfigPaths.files(name, directory)` for discovering config files
- Zod schemas in `config.ts` for validation

**IPC communication pattern:**
```typescript
// Main process (ipc.ts)
export function registerIpcHandlers(deps: Deps) {
  ipcMain.handle("channel-name", async (...) => {...})
}

// Preload (preload/index.ts)
const api: ElectronAPI = {
  channelName: (opts) => ipcRenderer.invoke("channel-name", opts),
}
contextBridge.exposeInMainWorld("api", api)

// Renderer
const result = await window.api.channelName(opts)
```

### External References

- [electron-vite](https://electron-vite.org/) - Build tool for Electron
- [electron-builder](https://www.electron.build/) - Packaging
- [SolidJS](https://www.solidjs.com/) - UI framework

## Key Technical Decisions

- **Separate package**: Create `packages/workspace-config-manager/` as a new standalone Electron app, not integrated into desktop-electron. Reason: different purpose, simpler scope, easier to iterate independently.
- **Shared config parsing**: Use opencode's existing `jsonc-parser` and config utilities where possible rather than implementing new parsing logic.
- **Profile storage**: Plain opencode.jsonc files in `~/.config/opencode-manager/profiles/` - portable and editable outside the app.
- **App config storage**: electron-store for workspace list, preferences, window state.
- **External editor**: Use `open` command (macOS) or `xdg-open` (Linux) to launch external editor.

## Open Questions

### Resolved During Planning

- **Package location**: Will create `packages/workspace-config-manager/` within the opencode monorepo structure, not in agent-config-studio.
- **JSONC parsing**: Confirmed `jsonc-parser` is available in opencode deps and handles comments correctly.
- **App entry point**: electron-vite with main/preload/renderer structure following desktop-electron pattern.

### Deferred to Implementation

- **Exact UI component library**: SolidJS component patterns from @opencode-ai/app to be reviewed during implementation.
- **Diff algorithm**: Will use `diff` package or similar for generating diffs between configs.
- **Error handling UX**: Specific error messages and recovery flows defined during implementation.

## Output Structure

```
packages/workspace-config-manager/
├── src/
│   ├── main/
│   │   ├── index.ts           # Entry point, app lifecycle
│   │   ├── ipc.ts            # IPC handlers
│   │   ├── windows.ts         # Window creation
│   │   ├── store.ts           # electron-store wrapper
│   │   ├── fileOps.ts         # File operations (read/write opencode.jsonc)
│   │   └── constants.ts       # Channel names, store names
│   ├── preload/
│   │   ├── index.ts          # contextBridge API exposure
│   │   └── types.ts          # TypeScript types
│   └── renderer/
│       ├── index.tsx         # SolidJS app entry
│       ├── index.html
│       ├── App.tsx            # Main app component
│       ├── components/
│       │   ├── WorkspaceList.tsx
│       │   ├── ProfileList.tsx
│       │   ├── ConfigViewer.tsx
│       │   ├── DiffPreview.tsx
│       │   └── QuickToggle.tsx
│       └── styles.css
├── electron.vite.config.ts
├── electron-builder.config.ts
├── package.json
└── tsconfig.json
```

## Implementation Units

- [ ] **Unit 1: Project scaffolding**

**Goal:** Create the Electron app structure with TypeScript, SolidJS, electron-vite

**Requirements:** R1-R4 (workspace management foundation)

**Dependencies:** None

**Files:**
- Create: `packages/workspace-config-manager/package.json`
- Create: `packages/workspace-config-manager/tsconfig.json`
- Create: `packages/workspace-config-manager/electron.vite.config.ts`
- Create: `packages/workspace-config-manager/electron-builder.config.ts`
- Create: `packages/workspace-config-manager/src/main/index.ts`
- Create: `packages/workspace-config-manager/src/main/windows.ts`
- Create: `packages/workspace-config-manager/src/main/store.ts`
- Create: `packages/workspace-config-manager/src/main/ipc.ts`
- Create: `packages/workspace-config-manager/src/main/constants.ts`
- Create: `packages/workspace-config-manager/src/main/fileOps.ts`
- Create: `packages/workspace-config-manager/src/preload/index.ts`
- Create: `packages/workspace-config-manager/src/preload/types.ts`
- Create: `packages/workspace-config-manager/src/renderer/index.html`
- Create: `packages/workspace-config-manager/src/renderer/index.tsx`
- Create: `packages/workspace-config-manager/src/renderer/App.tsx`
- Create: `packages/workspace-config-manager/src/renderer/styles.css`

**Approach:**
- Use electron-vite scaffold pattern matching desktop-electron
- SolidJS for renderer UI
- electron-store for workspace list persistence
- Standard IPC pattern with typed handlers

**Patterns to follow:**
- packages/desktop-electron/src/main/index.ts (app lifecycle)
- packages/desktop-electron/src/main/windows.ts (window creation with electron-window-state)
- packages/desktop-electron/src/main/store.ts (deferred electron-store init)

**Test scenarios:**
- Happy path: App launches and shows empty workspace list
- Edge case: First launch with no electron-store data initializes correctly
- Error path: Invalid electron-store data is gracefully handled

**Verification:**
- App window opens without errors
- Empty workspace list displayed

---

- [ ] **Unit 2: Workspace management**

**Goal:** Add/remove/list/select workspaces with opencode.jsonc files

**Requirements:** R1, R2, R3, R4

**Dependencies:** Unit 1

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`
- Modify: `packages/workspace-config-manager/src/preload/index.ts`
- Modify: `packages/workspace-config-manager/src/renderer/App.tsx`
- Create: `packages/workspace-config-manager/src/renderer/components/WorkspaceList.tsx`

**Approach:**
- IPC handlers: `workspace-add`, `workspace-remove`, `workspace-list`, `workspace-select`
- Directory picker via `dialog.showOpenDialog` restricted to directories
- Validate selected directory contains opencode.json or opencode.jsonc
- Store workspace list in electron-store keyed by directory path
- Renderer displays list with name (directory basename) and path

**Patterns to follow:**
- packages/desktop-electron/src/main/ipc.ts (handler registration pattern)
- desktop-electron handler: `open-directory-picker` for reference

**Test scenarios:**
- Happy path: Add workspace with valid opencode.jsonc, appears in list
- Edge case: Add workspace without opencode.jsonc shows validation error
- Edge case: Add same workspace twice handled gracefully
- Happy path: Remove workspace from list, directory unchanged on disk
- Happy path: Select workspace loads its config in ConfigViewer

**Verification:**
- Can add 5 workspaces and they persist across app restart
- Removing workspace removes from list but not from disk

---

- [ ] **Unit 3: Config viewer**

**Goal:** Display opencode.jsonc content in readable format

**Requirements:** R4, R17, R18, R19

**Dependencies:** Unit 2

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`
- Modify: `packages/workspace-config-manager/src/preload/index.ts`
- Create: `packages/workspace-config-manager/src/renderer/components/ConfigViewer.tsx`

**Approach:**
- IPC handler: `config-read` - reads file, parses JSONC, returns structured data
- Display agents list with enable/disable toggles
- Display plugins list with enable/disable toggles
- Display skills references (from config) with locations
- "Open in external editor" button launches `open` command
- Non-editable in app (view + external edit only per requirements)

**Patterns to follow:**
- packages/opencode/src/config/parse.ts for JSONC parsing pattern
- Use jsonc-parser directly since we're a separate package

**Test scenarios:**
- Happy path: Select workspace shows its config sections
- Edge case: Malformed JSONC shows parse error gracefully
- Edge case: Empty opencode.jsonc shows empty state
- Happy path: Open in external editor launches VS Code

**Verification:**
- Config sections display correctly
- External editor opens to correct file

---

- [ ] **Unit 4: Profile management (CRUD)**

**Goal:** Create, list, delete, rename profile templates

**Requirements:** R5, R6, R7, R8, R9

**Dependencies:** Unit 1

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`
- Modify: `packages/workspace-config-manager/src/renderer/App.tsx`
- Create: `packages/workspace-config-manager/src/renderer/components/ProfileList.tsx`

**Approach:**
- Profiles stored as opencode.jsonc in `~/.config/opencode-manager/profiles/`
- IPC handlers: `profile-create-from-workspace`, `profile-create-blank`, `profile-list`, `profile-delete`, `profile-rename`
- Profile list shows name (filename without .jsonc) and preview
- Create from workspace: copy that workspace's opencode.jsonc to profiles dir
- Create blank: write minimal opencode.jsonc with just `{}`
- Delete/rename: standard file operations

**Patterns to follow:**
- electron-store pattern for profile metadata if needed
- Standard Node.js fs operations for file CRUD

**Test scenarios:**
- Happy path: Create profile from workspace, appears in list
- Happy path: Create blank profile, file created with `{}`
- Happy path: Delete profile removes file from disk
- Happy path: Rename profile renames file
- Edge case: Profile name collision handled

**Verification:**
- Profiles persist in ~/.config/opencode-manager/profiles/
- Profile list updates immediately after CRUD operations

---

- [ ] **Unit 5: Profile application with diff preview**

**Goal:** Apply profile to workspace with merge preview

**Requirements:** R10, R11, R12

**Dependencies:** Unit 3 (config viewer), Unit 4 (profile list)

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`
- Create: `packages/workspace-config-manager/src/renderer/components/DiffPreview.tsx`

**Approach:**
- IPC handler: `config-apply-profile` with parameters: workspacePath, profilePath, sections[]
- Sections: "agents" | "plugins" | "full"
- Merge logic:
  - "full": replace entire opencode.jsonc
  - "agents": merge agent field, preserve others
  - "plugins": merge plugin field, preserve others
- Diff preview: compute diff between current config and result config, display in DiffViewer
- After user confirms, write the merged config

**Technical design:** *(directional guidance)*
```typescript
function mergeConfig(base: Config, profile: Config, sections: string[]): Config {
  if (sections.includes("full")) return profile
  const result = { ...base }
  if (sections.includes("agents")) {
    result.agent = { ...base.agent, ...profile.agent }
  }
  if (sections.includes("plugins")) {
    result.plugin = [...(base.plugin || []), ...(profile.plugin || [])]
  }
  return result
}
```

**Test scenarios:**
- Happy path: Apply full profile replaces workspace config
- Happy path: Apply agents section only preserves plugins
- Edge case: Profile has no agents section, workspace agents preserved
- Edge case: Conflict in agent names - profile takes precedence
- Happy path: Diff preview shows accurate changes

**Verification:**
- Applying profile produces correct merged result
- Diff accurately reflects what will change

---

- [ ] **Unit 6: Quick toggle for agents and plugins**

**Goal:** Enable/disable agents and plugins via toggle UI

**Requirements:** R13, R14, R15, R16

**Dependencies:** Unit 3 (config viewer)

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`
- Create: `packages/workspace-config-manager/src/renderer/components/QuickToggle.tsx`

**Approach:**
- For agents in opencode.jsonc: toggle `disable: true/false` in agent definition
- For plugins: toggle plugin entry in `plugin` array
- IPC handler: `config-toggle-agent`, `config-toggle-plugin`, `config-add-agent`, `config-remove-agent`, `config-add-plugin`, `config-remove-plugin`
- Changes written directly to workspace's opencode.jsonc
- Refresh config viewer after changes

**Patterns to follow:**
- Same merge/write pattern from Unit 5

**Test scenarios:**
- Happy path: Toggle agent disable flag, persists to file
- Happy path: Add new agent reference, appears in config
- Happy path: Remove plugin from list, file updated
- Edge case: Toggle non-existent agent handled gracefully
- Error path: File permission denied shows error

**Verification:**
- Toggle changes persist across app restart
- Config file is valid JSONC after changes

---

- [ ] **Unit 7: External editor integration**

**Goal:** Open configs in external editor from within app

**Requirements:** R19, R20

**Dependencies:** Unit 3, Unit 4

**Files:**
- Modify: `packages/workspace-config-manager/src/main/ipc.ts`

**Approach:**
- IPC handler: `open-in-external-editor` with filePath parameter
- Use `shell.openPath()` (Electron) or `child_process.spawn('open', [path])` (macOS)
- Detect platform: use `process.platform` to choose `open` (macOS/Linux) or `start` (Windows)

**Test scenarios:**
- Happy path: Open workspace config in VS Code
- Happy path: Open profile in external editor
- Edge case: No default editor for file type shows system picker

**Verification:**
- Correct file opens in editor

## System-Wide Impact

- **File system**: App reads/writes opencode.jsonc files. Incorrect merge logic could corrupt user configs. Mitigation: backup before write or use atomic rename.
- **No opencode integration**: App does not interact with opencode CLI or server. Workspace configs are independent.
- **No shared state**: Each workspace has its own opencode.jsonc. No cross-workspace synchronization.

## Risks & Dependencies

| Risk | Mitigation |
|------|------------|
| JSONC merge corruption | Create backup before write, validate result with JSONC parse |
| Missing error handling for file permissions | Wrap file ops in try/catch, show user-friendly error |
| Profile name collisions | Append number suffix on conflict |

## Documentation / Operational Notes

- App should ship with a brief README explaining:
  - Where profiles are stored (~/.config/opencode-manager/profiles/)
  - How to manually edit profiles
  - How to use with existing opencode workspaces
