---
date: 2026-04-20
topic: opencode-workspace-config-manager
---

# OpenCode Workspace Config Manager

## Problem Frame

**Who is affected:** Developers using opencode across multiple projects with varying configuration needs.

**What is changing:** A standalone desktop app that serves as a GUI for managing opencode configurations across workspaces.

**Why it matters:** OpenCode's agents, skills, and plugins can be installed globally (~/.config/opencode/) or per-project (.opencode/). Global installation creates clutter when not all projects need every agent. Per-project installation requires duplicating configuration for each new workspace. This app provides a middle ground: reusable configuration profiles that can be applied to any workspace with one click, plus quick toggling of individual components.

## Requirements

**Workspace Management**

- R1. User can manually add a workspace directory to the app by selecting a folder that contains an opencode.json or opencode.jsonc file
- R2. User can remove a workspace from the app (does not delete files, only removes from the app's list)
- R3. App displays list of added workspaces, showing workspace name and path
- R4. User can select a workspace to view its current opencode.jsonc configuration

**Profile Management**

- R5. User can create a new profile from an existing workspace's opencode.jsonc
- R6. User can create a new blank profile with minimal opencode.jsonc structure
- R7. Profiles are stored as opencode.jsonc files in ~/.config/opencode-manager/profiles/
- R8. User can delete a profile (does not affect workspaces using that profile)
- R9. User can rename a profile

**Profile Application**

- R10. User can apply a profile to a workspace
- R11. Before applying, app shows diff preview of current vs incoming configuration
- R12. When applying, user selects sections to merge: agents, plugins, or full config. Non-selected sections in the workspace are preserved.

**Quick Toggle**

- R13. User can enable/disable individual agents in a workspace's config via toggle UI
- R14. User can enable/disable individual plugins in a workspace's config via toggle UI
- R15. User can add/remove agents from opencode.jsonc via the app
- R16. User can add/remove plugins from opencode.jsonc via the app

**Skills Awareness**

- R17. App displays which skills are referenced in opencode.jsonc and where they are located (.opencode/skills/ or global)
- R18. App does not directly edit skill files, only manages references in opencode.jsonc

**External Editing**

- R19. User can open any workspace's opencode.jsonc in external editor from within the app
- R20. User can open any profile in external editor from within the app

## Success Criteria

- User can add 5 workspaces, create 3 profiles, and apply a profile to a workspace in under 2 minutes total
- Quick toggle changes are persisted correctly to opencode.jsonc
- Diff preview accurately shows all configuration differences before profile application
- App launches and displays workspace list within 3 seconds

## Scope Boundaries

- This app does NOT launch opencode sessions
- This app does NOT manage global opencode installation itself (agents, skills installed in ~/.config/opencode/)
- This app does NOT sync profiles to remote servers or share with teammates
- This app does NOT manage .opencode/agents/ markdown files directly (only agent references in opencode.jsonc)

## Key Decisions

- **Standalone Electron app**: Not integrated into opencode TUI. Runs independently as a settings/config management tool.
- **File-based profiles**: Profiles are plain opencode.jsonc files in ~/.config/opencode-manager/profiles/. Simple, portable, and editable outside the app.
- **Manual workspace addition**: User explicitly adds workspace directories. No auto-scanning.
- **Profile = full opencode.jsonc**: A profile is a complete opencode.jsonc that can be applied to workspaces.
- **Merge sections on apply**: When applying a profile, specified sections (agents, plugins, skills) merge with existing config. Non-specified sections remain untouched.
- **View + external edit only**: App displays config in readable format. User opens external editor (VS Code, etc.) to edit.

## Dependencies / Assumptions

- Assumes opencode is installed and functional on the system
- Assumes user has write permissions to workspace directories for config changes
- Assumes familiarity with opencode.jsonc structure (app assumes competence, not expertise)

## Outstanding Questions

### Deferred to Planning

- **[Needs research]** How does opencode.jsonc parsing handle comments (JSONC format)? Need to verify library support.
- **[Technical]** Should the app use opencode's existing config parsing logic or implement its own?
- **[Technical]** Electron app architecture - should it share code with opencode's desktop-electron package?

## Next Steps

-> /ce:plan
