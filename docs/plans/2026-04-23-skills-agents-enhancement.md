# Skills & Agents Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enhance agent and skill management with multi-level directory support, new project initialization, compact card display with hover tooltips, directory grouping, and description on hover.

**Architecture:**
- Extend `discoverAgents`/`discoverSkills` to recursively scan directories and read frontmatter descriptions
- Add `*` deny catch-all + explicit allow pattern for skills permission
- Introduce view mode toggle (compact/detailed) with hover tooltip delay
- Group agents/skills by top-level directory

**Tech Stack:** TypeScript, SolidJS, electron, JSONC

---

## Task 1: Update Type Definitions

**Files:**
- Modify: `src/preload/types.ts`

**Step 1: Add new type definitions**

```typescript
// Add to existing types
interface DiscoveredItem {
  name: string
  fullPath: string
  directory: string
  description: string
}

interface AgentsDiscovery {
  workspace: DiscoveredItem[]
  global: DiscoveredItem[]
}

interface SkillsDiscovery {
  workspace: DiscoveredItem[]
  global: DiscoveredItem[]
}

interface AgentItem {
  name: string
  fullPath: string
  enabled: boolean
  isGlobal: boolean
  directory: string
  description: string
}

interface SkillItem {
  name: string
  fullPath: string
  permission: "allow" | "deny"
  isGlobal: boolean
  directory: string
  description: string
}
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS (no new errors)

**Step 3: Commit**

```bash
git add src/preload/types.ts
git commit -m "feat: add enhanced types for multi-level directory support"
```

---

## Task 2: Update File Operations - Read Frontmatter

**Files:**
- Modify: `src/main/fileOps.ts`

**Step 1: Add YAML frontmatter reading utility**

Add to `fileOps.ts`:

```typescript
import YAML from 'yaml'

async function readFrontmatterDescription(filePath: string): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return ''
    const yaml = YAML.parse(match[1])
    return yaml.description || ''
  } catch {
    return ''
  }
}
```

**Step 2: Verify imports work**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/main/fileOps.ts
git commit -m "feat: add readFrontmatterDescription helper"
```

---

## Task 3: Update discoverAgents to Support Multi-Level Directories

**Files:**
- Modify: `src/main/fileOps.ts`

**Step 1: Modify discoverAgents function**

Replace the existing `discoverAgents` implementation:

```typescript
async function discoverAgents(basePath: string): Promise<AgentsDiscovery> {
  const result: AgentsDiscovery = { workspace: [], global: [] }

  async function scanDir(dir: string, base: string, isGlobal: boolean): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        await scanDir(fullPath, base, isGlobal)
      } else if (entry.name === 'SKILL.md' || entry.name.endsWith('.md')) {
        const relPath = path.relative(base, fullPath).replace(/\.md$/, '')
        const parts = relPath.split(path.sep)
        const name = parts.pop()!
        const directory = parts.join(path.sep) || 'root'
        const description = await readFrontmatterDescription(fullPath)

        const item: DiscoveredItem = { name, fullPath: relPath, directory, description }
        if (isGlobal) {
          result.global.push(item)
        } else {
          result.workspace.push(item)
        }
      }
    }
  }

  await scanDir(basePath, basePath, false)
  return result
}
```

Note: Keep existing `discoverAgents` for backward compatibility during transition if needed, or replace entirely.

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/main/fileOps.ts
git commit -m "feat: support multi-level directories in agent discovery"
```

---

## Task 4: Update discoverSkills to Support Multi-Level Directories

**Files:**
- Modify: `src/main/fileOps.ts`

**Step 1: Modify discoverSkills function**

```typescript
async function discoverSkills(basePath: string): Promise<SkillsDiscovery> {
  const result: SkillsDiscovery = { workspace: [], global: [] }

  async function scanDir(dir: string, base: string, isGlobal: boolean): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        const skillMdPath = path.join(fullPath, 'SKILL.md')
        if (await fileExists(skillMdPath)) {
          const relPath = path.relative(base, fullPath)
          const parts = relPath.split(path.sep)
          const name = parts.pop()!
          const directory = parts.join(path.sep) || 'root'
          const description = await readFrontmatterDescription(skillMdPath)

          const item: DiscoveredItem = { name, fullPath: relPath, directory, description }
          if (isGlobal) {
            result.global.push(item)
          } else {
            result.workspace.push(item)
          }
        } else {
          await scanDir(fullPath, base, isGlobal)
        }
      }
    }
  }

  await scanDir(basePath, basePath, false)
  return result
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/main/fileOps.ts
git commit -m "feat: support multi-level directories in skill discovery"
```

---

## Task 5: Add New Project Skills Initialization

**Files:**
- Modify: `src/main/fileOps.ts`

**Step 1: Add initializeNewProjectSkills function**

```typescript
async function initializeNewProjectSkills(workspacePath: string): Promise<void> {
  const skills = await discoverSkills(workspacePath)
  const config = await configRead(workspacePath)

  config.permission ??= {}
  config.permission.skill ??= {}
  config.permission.skill['*'] = 'deny'

  const allSkills = [...skills.workspace, ...skills.global]
  for (const skill of allSkills) {
    config.permission.skill[skill.fullPath] = 'allow'
  }

  await configWrite(workspacePath, config)
}
```

**Step 2: Export the new function**

Add to the exports at the bottom of `fileOps.ts`:
```typescript
export { ..., initializeNewProjectSkills }
```

**Step 3: Add IPC handler**

Modify `src/main/ipc.ts` to add handler:
```typescript
ipc.handle('skillsInitialize', async (_, workspacePath: string) => {
  return initializeNewProjectSkills(workspacePath)
})
```

**Step 4: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 5: Commit**

```bash
git add src/main/fileOps.ts src/main/ipc.ts
git commit -m "feat: add new project skills initialization with * deny catch-all"
```

---

## Task 6: Create Tooltip Component

**Files:**
- Create: `src/renderer/components/Tooltip.tsx`

**Step 1: Create Tooltip component**

```typescript
import { Component, createSignal, Show, JSX } from 'solid-js'

interface TooltipProps {
  content: JSX.Element
  children: JSX.Element
  delay?: number
}

export const Tooltip: Component<TooltipProps> = (props) => {
  const [show, setShow] = createSignal(false)
  let timer: number | undefined

  const handleMouseEnter = () => {
    timer = window.setTimeout(() => setShow(true), props.delay ?? 300)
  }

  const handleMouseLeave = () => {
    if (timer) clearTimeout(timer)
    setShow(false)
  }

  return (
    <div
      class="tooltip-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {props.children}
      <Show when={show()}>
        <div class="tooltip-content">{props.content}</div>
      </Show>
    </div>
  )
}
```

**Step 2: Add tooltip styles to styles.css**

```css
.tooltip-wrapper {
  position: relative;
  display: inline-block;
}

.tooltip-content {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  padding: 8px 12px;
  background: var(--bg-elevated);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  min-width: 200px;
  max-width: 300px;
  white-space: normal;
}
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/Tooltip.tsx src/renderer/styles.css
git commit -m "feat: add Tooltip component with delay"
```

---

## Task 7: Create ViewToggle Component

**Files:**
- Create: `src/renderer/components/ViewToggle.tsx`

**Step 1: Create ViewToggle component**

```typescript
import { Component } from 'solid-js'

interface ViewToggleProps {
  mode: "compact" | "detailed"
  onChange: (mode: "compact" | "detailed") => void
}

export const ViewToggle: Component<ViewToggleProps> = (props) => {
  return (
    <div class="view-toggle">
      <button
        class={props.mode === "compact" ? "active" : ""}
        onClick={() => props.onChange("compact")}
      >
        Compact
      </button>
      <button
        class={props.mode === "detailed" ? "active" : ""}
        onClick={() => props.onChange("detailed")}
      >
        Detailed
      </button>
    </div>
  )
}
```

**Step 2: Add view toggle styles**

```css
.view-toggle {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: var(--bg-muted);
  border-radius: 6px;
}

.view-toggle button {
  padding: 4px 12px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  border-radius: 4px;
}

.view-toggle button.active {
  background: var(--bg-elevated);
  color: var(--text);
}
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/ViewToggle.tsx src/renderer/styles.css
git commit -m "feat: add ViewToggle component"
```

---

## Task 8: Update AgentCard with Tooltip and Compact Mode

**Files:**
- Modify: `src/renderer/components/AgentCard.tsx`

**Step 1: Update AgentCard interface and structure**

```typescript
import { Component, Show } from 'solid-js'
import { Tooltip } from './Tooltip'

interface AgentItem {
  name: string
  fullPath: string
  enabled: boolean
  isGlobal: boolean
  directory: string
  description: string
}

interface AgentCardProps {
  agent: AgentItem
  viewMode: "compact" | "detailed"
  onToggle: (name: string) => void
}

export const AgentCard: Component<AgentCardProps> = (props) => {
  const tooltipContent = () => (
    <div class="tooltip-info">
      <Show when={props.agent.directory !== 'root'}>
        <div class="tooltip-directory">{props.agent.directory}/</div>
      </Show>
      <Show when={props.agent.description}>
        <div class="tooltip-description">{props.agent.description}</div>
      </Show>
      <Show when={props.agent.isGlobal}>
        <span class="badge global">Global</span>
      </Show>
    </div>
  )

  return (
    <Tooltip content={tooltipContent()}>
      <div
        class={`agent-card ${props.viewMode}`}
        onClick={() => props.onToggle(props.agent.fullPath)}
      >
        <div class="card-header">
          <span class={`status-dot ${props.agent.enabled ? 'enabled' : 'disabled'}`} />
          <span class="agent-name">{props.agent.name}</span>
          <Show when={props.agent.isGlobal}>
            <span class="badge global">Global</span>
          </Show>
        </div>

        <Show when={props.viewMode === 'detailed'}>
          <Show when={props.agent.directory !== 'root'}>
            <div class="card-directory">{props.agent.directory}/</div>
          </Show>
          <Show when={props.agent.description}>
            <div class="card-description">{props.agent.description}</div>
          </Show>
        </Show>
      </div>
    </Tooltip>
  )
}
```

**Step 2: Add compact styles**

```css
.agent-card {
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.agent-card.compact {
  padding: 8px 12px;
}

.agent-card.detailed {
  padding: 12px;
}
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/AgentCard.tsx src/renderer/styles.css
git commit -m "feat: update AgentCard with compact mode and tooltip"
```

---

## Task 9: Update SkillCard - Remove Ask, Compact Mode

**Files:**
- Modify: `src/renderer/components/SkillCard.tsx`

**Step 1: Update SkillCard to remove ask checkbox and support compact mode**

```typescript
import { Component, Show } from 'solid-js'
import { Tooltip } from './Tooltip'

interface SkillItem {
  name: string
  fullPath: string
  permission: "allow" | "deny"
  isGlobal: boolean
  directory: string
  description: string
}

interface SkillCardProps {
  skill: SkillItem
  viewMode: "compact" | "detailed"
  onToggle: (name: string) => void
}

export const SkillCard: Component<SkillCardProps> = (props) => {
  const tooltipContent = () => (
    <div class="tooltip-info">
      <Show when={props.skill.directory !== 'root'}>
        <div class="tooltip-directory">{props.skill.directory}/</div>
      </Show>
      <Show when={props.skill.description}>
        <div class="tooltip-description">{props.skill.description}</div>
      </Show>
      <Show when={props.skill.isGlobal}>
        <span class="badge global">Global</span>
      </Show>
    </div>
  )

  return (
    <Tooltip content={tooltipContent()}>
      <div
        class={`skill-card ${props.viewMode}`}
        onClick={() => props.onToggle(props.skill.fullPath)}
      >
        <div class="card-header">
          <span class={`status-dot ${props.skill.permission === 'allow' ? 'enabled' : 'disabled'}`} />
          <span class="skill-name">{props.skill.name}</span>
        </div>

        <Show when={props.viewMode === 'detailed'}>
          <Show when={props.skill.directory !== 'root'}>
            <div class="card-directory">{props.skill.directory}/</div>
          </Show>
          <Show when={props.skill.description}>
            <div class="card-description">{props.skill.description}</div>
          </Show>
          <Show when={props.skill.isGlobal}>
            <span class="badge global">Global</span>
          </Show>
        </Show>
      </div>
    </Tooltip>
  )
}
```

**Step 2: Add compact skill card styles (height ~32px)**

```css
.skill-card {
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.skill-card.compact {
  padding: 6px 10px;
  height: 32px;
  display: flex;
  align-items: center;
}

.skill-card.detailed {
  padding: 10px 12px;
}
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/SkillCard.tsx src/renderer/styles.css
git commit -m "feat: update SkillCard - remove ask checkbox, add compact mode"
```

---

## Task 10: Create GroupedSection Component

**Files:**
- Create: `src/renderer/components/GroupedSection.tsx`

**Step 1: Create GroupedSection component**

```typescript
import { Component, For, Show, createSignal } from 'solid-js'

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
```

**Step 2: Add grouped section styles**

```css
.grouped-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
}

.section-title {
  font-weight: 600;
  font-size: 14px;
  color: var(--text);
}

.section-count {
  color: var(--text-muted);
  font-size: 12px;
}

.collapse-icon {
  font-size: 10px;
  transition: transform 0.15s ease;
}

.collapse-icon.collapsed {
  transform: rotate(-90deg);
}

.section-items {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 8px;
  padding-left: 16px;
}
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/components/GroupedSection.tsx src/renderer/styles.css
git commit -m "feat: add GroupedSection component for directory grouping"
```

---

## Task 11: Update CardGrid for Grouping and View Mode

**Files:**
- Modify: `src/renderer/components/CardGrid.tsx`

**Step 1: Add grouping logic and view mode support**

```typescript
import { Component, For, Show, createMemo } from 'solid-js'
import { AgentCard } from './AgentCard'
import { SkillCard } from './SkillCard'
import { PluginCard } from './PluginCard'
import { GroupedSection } from './GroupedSection'
import { ViewToggle } from './ViewToggle'

interface CardGridProps {
  activeTab: 'agents' | 'skills' | 'plugins'
  agents: AgentItem[]
  skills: SkillItem[]
  plugins: PluginItem[]
  viewMode: 'compact' | 'detailed'
  onViewModeChange: (mode: 'compact' | 'detailed') => void
  onAgentToggle: (name: string) => void
  onSkillToggle: (name: string) => void
  onPluginToggle: (name: string) => void
}

export const CardGrid: Component<CardGridProps> = (props) => {
  const groupedAgents = createMemo(() => {
    const groups: Record<string, AgentItem[]> = {}
    for (const agent of props.agents) {
      const dir = agent.directory || 'root'
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(agent)
    }
    return groups
  })

  const groupedSkills = createMemo(() => {
    const groups: Record<string, SkillItem[]> = {}
    for (const skill of props.skills) {
      const dir = skill.directory || 'root'
      if (!groups[dir]) groups[dir] = []
      groups[dir].push(skill)
    }
    return groups
  })

  return (
    <div class="card-grid-container">
      <ViewToggle mode={props.viewMode} onChange={props.onViewModeChange} />

      <Show when={props.activeTab === 'agents'}>
        <For each={Object.entries(groupedAgents())}>
          {([directory, agents]) => (
            <GroupedSection
              title={directory}
              items={agents}
              renderItem={(agent) => (
                <AgentCard
                  agent={agent}
                  viewMode={props.viewMode}
                  onToggle={props.onAgentToggle}
                />
              )}
            />
          )}
        </For>
      </Show>

      <Show when={props.activeTab === 'skills'}>
        <For each={Object.entries(groupedSkills())}>
          {([directory, skills]) => (
            <GroupedSection
              title={directory}
              items={skills}
              renderItem={(skill) => (
                <SkillCard
                  skill={skill}
                  viewMode={props.viewMode}
                  onToggle={props.onSkillToggle}
                />
              )}
            />
          )}
        </For>
      </Show>

      <Show when={props.activeTab === 'plugins'}>
        <div class="plugins-grid">
          <For each={props.plugins}>
            {(plugin) => (
              <PluginCard
                plugin={plugin}
                onToggle={props.onPluginToggle}
              />
            )}
          </For>
        </div>
      </Show>
    </div>
  )
}
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/renderer/components/CardGrid.tsx
git commit -m "feat: update CardGrid with grouping and view mode"
```

---

## Task 12: Update App.tsx - Add View Mode State and Initialize Skills

**Files:**
- Modify: `src/renderer/App.tsx`

**Step 1: Add viewMode signal and initialize skills on workspace change**

```typescript
// Add to state
const [viewMode, setViewMode] = createSignal<"compact" | "detailed">("compact")

// Modify selectedWorkspace effect to initialize skills
createEffect(async () => {
  const ws = selectedWorkspace()
  if (ws) {
    await window.api.workspaceSelect(ws.path)
    await window.api.skillsInitialize(ws.path)  // Add this line
    const [wc, gc] = await Promise.all([
      window.api.configRead(ws.path),
      window.api.configRead()
    ])
    workspaceConfig(() => wc)
    globalConfig(() => gc)
    await loadDiscoveries(ws.path)
  }
})
```

**Step 2: Update render to pass viewMode and handlers to CardGrid**

```tsx
<CardGrid
  activeTab={activeTab()}
  agents={cardAgents()}
  skills={cardSkills()}
  plugins={cardPlugins()}
  viewMode={viewMode()}
  onViewModeChange={setViewMode}
  onAgentToggle={handleAgentToggle}
  onSkillToggle={handleSkillToggle}
  onPluginToggle={handlePluginToggle}
/>
```

**Step 3: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 4: Commit**

```bash
git add src/renderer/App.tsx
git commit -m "feat: add viewMode state and initialize skills on workspace change"
```

---

## Task 13: Add Preload API for skillsInitialize

**Files:**
- Modify: `src/preload/index.ts`

**Step 1: Add skillsInitialize to context bridge**

```typescript
contextBridge.exposeInMainWorld('api', {
  ...
  skillsInitialize: (workspacePath: string) => ipcRenderer.invoke('skillsInitialize', workspacePath),
})
```

**Step 2: Verify typecheck passes**

Run: `npm run typecheck`
Expected: PASS

**Step 3: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: expose skillsInitialize in preload API"
```

---

## Task 14: Update Types in Preload

**Files:**
- Modify: `src/preload/types.ts` (if additional types needed)

Note: Types should already be added in Task 1.

**Step 1: Verify types match implementation**

Run: `npm run typecheck`
Expected: PASS

**Step 2: Commit**

```bash
git add src/preload/types.ts
git commit -m "chore: verify types align with implementation"
```

---

## Task 15: Integration Testing

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test multi-level agent discovery**
- Create test agents in nested directories
- Verify they appear with correct grouping

**Step 3: Test skill initialization**
- Open a new workspace
- Check that skills are initialized with `*` deny + individual allows

**Step 4: Test view toggle**
- Switch between compact and detailed modes
- Verify cards resize correctly

**Step 5: Test hover tooltips**
- Hover over cards for 300ms
- Verify tooltip appears with description

**Step 6: Test skill toggle**
- Click skill cards
- Verify permission toggles between allow/deny

---

## Summary of File Changes

| File | Change |
|------|--------|
| `src/preload/types.ts` | Add enhanced types |
| `src/preload/index.ts` | Expose skillsInitialize |
| `src/main/fileOps.ts` | Multi-level discovery, frontmatter reading, init skills |
| `src/main/ipc.ts` | Add skillsInitialize handler |
| `src/renderer/components/Tooltip.tsx` | New component |
| `src/renderer/components/ViewToggle.tsx` | New component |
| `src/renderer/components/GroupedSection.tsx` | New component |
| `src/renderer/components/AgentCard.tsx` | Compact mode, tooltip |
| `src/renderer/components/SkillCard.tsx` | Remove ask, compact mode, tooltip |
| `src/renderer/components/CardGrid.tsx` | Grouping, view mode |
| `src/renderer/App.tsx` | View mode state, init call |
| `src/renderer/styles.css` | New styles |

---

**Plan complete.**