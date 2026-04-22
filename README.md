# Agent Config Studio

A desktop application for managing [opencode](https://opencode.ai) workspace configurations. View and manage agents, skills, and plugins across your local workspaces and global config.

## Features

- **Workspace Management** — Add and manage multiple opencode workspaces
- **Agent Toggle** — Enable/disable agents per workspace or globally
- **Skill Permissions** — Control skill access (allow/deny/ask) with per-workspace and global overrides
- **Plugin Management** — Enable/disable plugins
- **Profile System** — Save and apply configuration profiles with diff preview before merging
- **JSONC Support** — Reads and writes `opencode.jsonc` config files with comment preservation

## Screenshots

[Add screenshots here]

## Installation

### macOS

Download the latest `.dmg` from [Releases](https://github.com/yxc023/agent-config-studio/releases):

```
agent-config-studio-mac-arm64.dmg
```

### Build from Source

```bash
pnpm install
pnpm run build
pnpm run package
```

Output will be in `dist/`.

## Usage

1. **Add a workspace** — Click "+ Add Workspace" and select an opencode workspace folder
2. **Browse agents/skills/plugins** — Select a tab to view discovered components
3. **Toggle items** — Click to enable/disable agents, plugins, or change skill permissions
4. **Manage profiles** — Create profiles from current config, preview diff, and apply

## Configuration Locations

Agent Config Studio reads from standard opencode config directories:

| Config | Location |
|--------|----------|
| Global config | `~/.config/opencode/opencode.jsonc` |
| Workspace config | `<workspace>/.opencode/config.json` or `opencode.jsonc` |
| Profiles | `~/.config/opencode-manager/profiles/` |
| Skill dirs | `~/.config/opencode/skills`, `~/.claude/skills`, `~/.agents/skills` |

## Tech Stack

- **Electron** — Desktop framework
- **SolidJS** — UI framework
- **Tailwind CSS** — Styling
- **electron-vite** — Build tooling
- **electron-builder** — Packaging

## Development

```bash
pnpm run dev      # Start with hot reload
pnpm run build    # Production build
pnpm run typecheck # TypeScript check
```

## License

MIT
