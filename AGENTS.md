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
