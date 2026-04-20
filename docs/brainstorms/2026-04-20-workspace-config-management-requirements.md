---
date: 2026-04-20
topic: workspace-config-management
---

# Workspace Config Management

## Problem Frame

Users need a visual way to manage opencode workspace configurations, including enabling/disabling agents, skills, and plugins. The app must show how global configurations affect the current workspace while only allowing edits to workspace-local settings. New workspaces should initialize from a secure deny-by-default template.

## Requirements

### Workspace Selection & Config Loading

- R1. When a workspace is selected, display its name and path in the header
- R2. Load the workspace's local `opencode.jsonc` config
- R3. Also read the global config (`~/.config/opencode/opencode.jsonc`) to determine effective configuration
- R4. If the workspace has no local config, offer to initialize from the default template

### Default Template

- R5. Default template disables all agents via `disable: true`
- R6. Default template sets all skill permissions to `deny` via `permission.skill`
- R7. Default template omits all plugins (effectively disabling them)
- R8. Template file located at `resources/default-template.jsonc` in the app bundle

### Agents Display & Management

- R9. Display all agents in two groups: **Workspace** and **Global (Read-only)**
- R10. Agents defined in the workspace config belong to **Workspace** group
- R11. Agents only in the global config belong to **Global (Read-only)** group
- R12. Global agents cannot be edited; show a lock icon and muted styling
- R13. Workspace agents show a toggle switch for enabled/disabled state
- R14. Agent `disable: true` in config = disabled; `disable: false` or absent = enabled
- R15. Toggling an agent writes `disable: true/false` to the workspace config

### Skills Display & Management

- R16. Display all skills in two groups: **Workspace** and **Global (Read-only)**
- R17. Skills are permission-controlled, not directly enabled/disabled
- R18. Workspace skills show permission dropdown: `allow`, `ask`, `deny`
- R19. Global skills are read-only; show current permission value with lock icon
- R20. Skills are discovered from `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` in workspace and global config directories
- R21. Skill permission is configured via `permission.skill` with pattern matching

### Plugins Display & Management

- R22. Display all plugins in two groups: **Workspace** and **Global (Read-only)**
- R23. Plugins from workspace config `plugin` array belong to **Workspace** group
- R24. Plugins from global config belong to **Global (Read-only)** group
- R25. Workspace plugins show a toggle to enable/disable
- R26. Global plugins are read-only; show as enabled with lock icon
- R27. Removing a plugin from workspace config effectively disables it

### Config File Operations

- R28. Changes are saved directly to the workspace's `opencode.jsonc`
- R29. Save triggers automatically on toggle change (no explicit save button)
- R30. Show a brief success toast on save
- R31. Show error banner if save fails with error message

### New Workspace Initialization

- R32. When adding a workspace that has no `opencode.jsonc`, prompt user to initialize
- R33. Offer "Initialize with default template" option
- R34. Initialize creates `opencode.jsonc` in the workspace root using the default template

### UI Layout

- R35. Left sidebar shows workspace list and profile list (existing)
- R36. Main content area shows three collapsible sections: **Agents**, **Skills**, **Plugins**
- R37. Each section has a header with section name and item count
- R38. Each section has two sub-groups: Workspace (editable) and Global (read-only)
- R39. Read-only items show a lock icon and muted text color (--text-muted: #666666)
- R40. Editable items show interactive controls (toggle, dropdown)

### UI Visual Design

- R41. Dark theme matching current app aesthetic (bg-primary: #1a1a1a)
- R42. Section headers use uppercase text with letter-spacing
- R43. Workspace items have full opacity; Global items have 60% opacity
- R44. Toggle switches use accent color (#0a84ff) when enabled
- R45. Lock icon (🔒) displayed inline before Global item names
- R46. Collapsible sections remember expanded/collapsed state during session

## Success Criteria

- SC1. Selecting a workspace shows all agents, skills, and plugins visible to that workspace
- SC2. Global (read-only) items are visually distinct and cannot be interacted with
- SC3. Toggling a workspace agent immediately updates the config file
- SC4. Changing a workspace skill permission immediately updates the config file
- SC5. Adding a new workspace without config offers initialization from template
- SC6. No changes can be made to global config files through this app

## Scope Boundaries

- This app does NOT edit global configs
- This app does NOT directly modify skills/plugin source files, only the config references
- This app does NOT provide agent creation/editing (only enable/disable existing agents)

## Key Decisions

- **Deny-by-default template**: All agents/skills/plugins start disabled, requiring explicit opt-in. Rationale: Security-conscious default, users enable what they need.
- **Direct save on toggle**: No staging area or explicit save button. Rationale: Simplest UX for frequent small changes.
- **Permission-based skills**: Skills use permission config rather than a simple enable/disable. Rationale: Matches opencode's native permission model.
- **D1: Template is fixed built-in** — Default template is bundled with the app and cannot be modified by users.
- **D2: Skills discovery via filesystem** — Skills are discovered by scanning `.opencode/skills/`, `.claude/skills/`, `.agents/skills/` directories in workspace and global config paths.
- **D3: Agent conflict resolution** — When an agent exists in both global and workspace config, it appears only in the **Workspace** group (workspace config takes precedence).

## Dependencies / Assumptions

- Assumes opencode config structure is stable (agent, permission.skill, plugin keys)
- Assumes global config path is `~/.config/opencode/opencode.jsonc` on macOS, `%APPDATA%\opencode\opencode.jsonc` on Windows, `~/.config/opencode/opencode.jsonc` on Linux
- Needs to traverse up from workspace to find git root for skills discovery
- opencode supports `disable: true/false` on agents to enable/disable them
