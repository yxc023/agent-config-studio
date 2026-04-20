---
title: Electron macOS titlebar traffic lights not clickable with titleBarStyle hidden
date: 2026-04-20
category: docs/solutions/ui-bugs
module: electron
problem_type: ui_bug
component: tooling
symptoms:
  - macOS traffic lights not clickable with titleBarStyle "hidden"
  - Window controls inaccessible to users
  - Content overlaps traffic light area when using "hidden"
root_cause: config_error
resolution_type: config_change
severity: high
related_components:
  - src/main/windows.ts
tags:
  - electron
  - macos
  - titlebar
  - traffic-lights
---

# Electron macOS titlebar traffic lights not clickable with titleBarStyle hidden

## Problem

macOS Electron app launched as desktop window without menu bar spacing at top, and window position dragging was not supported in the traffic light area.

## Symptoms

- Traffic lights not visible/clickable when using `titleBarStyle: "hidden"`
- Window content overlapping native titlebar area
- Window not draggable via traffic light area

## What Didn't Work

1. **`titleBarStyle: "hiddenInset"` with custom titlebar div** - Content still overlapped the traffic light area because the custom titlebar div added unnecessary spacing
2. **`titleBarStyle: "hidden"` with custom draggable titlebar** - Traffic lights stopped working (not rendered/clickable), but window dragging via custom titlebar worked
3. **Dead code** - `const mode = nativeTheme.shouldUseDarkColors ? "dark" : "light"` was defined but never used, with `nativeTheme` imported unnecessarily

## Solution

**`src/main/windows.ts`** - Changed `titleBarStyle` back to `hiddenInset` and removed unused import:

```diff
- import { app, BrowserWindow, nativeTheme } from "electron"
+ import { app, BrowserWindow } from "electron"

  const state = windowState({
    defaultWidth: 1000,
    defaultHeight: 700,
  })

- const mode = nativeTheme.shouldUseDarkColors ? "dark" : "light" // DEAD CODE

  const win = new BrowserWindow({
    ...
    ...(process.platform === "darwin"
      ? {
-         titleBarStyle: "hidden" as const,
+         titleBarStyle: "hiddenInset" as const,
        }
      : {}),
```

**`src/renderer/App.tsx`** - Removed custom titlebar div that was wrapping the app content

**`src/renderer/styles.css`** - Removed titlebar CSS styles (`.titlebar`, `.titlebar-drag-region`, `.titlebar-menu`, `.titlebar-title`)

## Why This Works

`titleBarStyle: "hiddenInset"` tells Electron to:
1. Keep native traffic lights visible and clickable
2. Automatically inset the web content so it doesn't overlap the traffic light area
3. Allow window dragging via the traffic light region

`titleBarStyle: "hidden"` hides the traffic lights entirely in the web content area, requiring custom implementation - which was broken and unnecessary.

## Prevention

1. **Test macOS window controls (traffic lights)** on every PR involving window configuration changes
2. **Remove dead code** (like the unused `mode` variable) during bug fixes to reduce noise and confusion
3. **Prefer native Electron title bar styles** over custom implementations unless absolutely necessary
4. **Use `hiddenInset`** for macOS frameless windows when you want both native traffic lights and proper content spacing

## Related Issues

- Initial issue: App launched as desktop, top has no menu bar spacing and window dragging not supported
