# Agent Config Studio

Desktop Electron app for managing opencode workspace configurations.

## Dev Commands

```bash
npm run dev      # Start dev server with hot reload
npm run build    # Build for production
npm run package  # Package as .dmg (mac)
npm run typecheck # TypeScript check only
```

## Project Structure

```
src/
├── main/           # Electron main process
│   ├── index.ts    # Entry point
│   ├── windows.ts  # Window creation (titleBarStyle, preload, etc.)
│   ├── ipc.ts     # IPC handlers
│   ├── store.ts   # electron-store wrapper
│   ├── fileOps.ts # Config file operations
│   └── jsonc.ts   # JSONC merge/diff utilities
├── preload/       # Context bridge API
│   └── index.ts   # Exposes window.api to renderer
└── renderer/      # SolidJS frontend
    ├── App.tsx    # Main component
    ├── styles.css # Global styles
    └── components/
```

## macOS Titlebar

Use `titleBarStyle: "hiddenInset"` for native traffic lights with proper content inset. Using `"hidden"` hides traffic lights and requires custom drag implementation.

## Package Manager

Uses `pnpm` (configured in `packageManager` field). Run `pnpm install` if needed.

## Key Dependencies

- `electron-store` - persistent config storage
- `electron-window-state` - remembers window position/size
- `jsonc-parser` - parses JSON with comments
- `solid-js` - UI framework

## Testing

See [TESTING.md](./TESTING.md) for comprehensive testing and verification methods.

### Test Directory

Located in `test/` directory for regression testing:

```
test/
├── test-workspace/              # Workspace 目录（App 添加此目录）
│   ├── opencode.jsonc           # 测试配置
│   └── .opencode/
│       ├── agents/              # 测试 agents
│       └── skills/              # 测试 skills
│
└── opencode-config-global/     # 全局配置目录（测试 OPENCODE_CONFIG_DIR）
    └── .opencode/
        ├── agents/
        └── skills/
```

### 快速验证

```bash
npm run verify  # 运行所有验证脚本
```

### 手动测试

```bash
# 使用全局配置目录运行 opencode
cd test/test-workspace
OPENCODE_CONFIG_DIR=../opencode-config-global opencode run "list skills"
```
