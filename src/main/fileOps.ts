import { readFile, writeFile, readdir, mkdir, rm, rename, copyFile, access } from "node:fs/promises"
import { join, basename, relative, sep } from "node:path"
import { parse as parseJsonc, printParseErrorCode, type ParseError } from "jsonc-parser"
import * as YAML from "yaml"
import { editJsonc } from "./jsonc"
import { GLOBAL_CONFIG_DIR, GLOBAL_CONFIG_FILE, SKILL_SEARCH_DIRS, AGENT_SEARCH_DIRS, PLUGIN_SEARCH_DIRS, GLOBAL_SKILL_DIRS, GLOBAL_AGENT_DIRS } from "./constants"
import type { AgentsDiscovery, SkillsDiscovery, DiscoveredItem } from "../preload/types"

export interface Workspace {
  id: string
  name: string
  path: string
  configPath: string | null
}

export interface Profile {
  id: string
  name: string
  path: string
}

export interface ConfigData {
  agent?: Record<string, unknown>
  plugin?: string[]
  [key: string]: unknown
}

export async function findOpencodeConfig(dirPath: string): Promise<string | null> {
  const jsoncPath = join(dirPath, "opencode.jsonc")
  const jsonPath = join(dirPath, "opencode.json")

  try {
    await access(jsoncPath)
    return jsoncPath
  } catch {
    try {
      await access(jsonPath)
      return jsonPath
    } catch {
      return null
    }
  }
}

export async function readConfig(filePath: string): Promise<ConfigData> {
  const content = await readFile(filePath, "utf-8")
  const errors: ParseError[] = []
  const parsed = parseJsonc(content, errors)
  if (errors.length > 0) {
    throw new Error(`Invalid JSONC: ${errors.map((e) => printParseErrorCode(e.error)).join(", ")}`)
  }
  return parsed as ConfigData
}

export async function writeConfig(filePath: string, data: ConfigData): Promise<void> {
  const content = editJsonc(data)
  await writeFile(filePath, content, "utf-8")
}

export async function listProfiles(profilesDir: string): Promise<Profile[]> {
  try {
    const files = await readdir(profilesDir)
    return files
      .filter((f) => f.endsWith(".jsonc") || f.endsWith(".json"))
      .map((f) => ({
        id: f,
        name: f.replace(/\.(jsonc|json)$/, ""),
        path: join(profilesDir, f),
      }))
  } catch {
    return []
  }
}

export async function createProfile(profilesDir: string, name: string, data?: ConfigData): Promise<Profile> {
  await mkdir(profilesDir, { recursive: true })
  const filename = `${name}.jsonc`
  const filepath = join(profilesDir, filename)
  const content = data ? editJsonc(data) : "{}"
  await writeFile(filepath, content, "utf-8")
  return { id: filename, name, path: filepath }
}

export async function deleteProfile(profilePath: string): Promise<void> {
  await rm(profilePath)
}

export async function renameProfile(profilePath: string, newName: string): Promise<string> {
  const dir = dirname(profilePath)
  const ext = extname(profilePath)
  const newPath = join(dir, `${newName}${ext}`)
  await rename(profilePath, newPath)
  return newPath
}

export async function copyConfigToProfile(sourcePath: string, profilesDir: string, profileName: string): Promise<Profile> {
  const filename = `${profileName}.jsonc`
  const destPath = join(profilesDir, filename)
  await mkdir(profilesDir, { recursive: true })
  await copyFile(sourcePath, destPath)
  return { id: filename, name: profileName, path: destPath }
}

function dirname(path: string): string {
  const parts = path.replace(/\\/g, "/").split("/")
  parts.pop()
  return parts.join("/") || "/"
}

function extname(path: string): string {
  const name = basename(path)
  const dotIndex = name.lastIndexOf(".")
  return dotIndex >= 0 ? name.slice(dotIndex) : ""
}

export function getGlobalConfigPath(): string {
  return join(GLOBAL_CONFIG_DIR, GLOBAL_CONFIG_FILE)
}

export async function readGlobalConfig(): Promise<ConfigData | null> {
  const configPath = getGlobalConfigPath()
  try {
    await access(configPath)
    return await readConfig(configPath)
  } catch {
    return null
  }
}

export async function writeGlobalConfig(data: ConfigData): Promise<void> {
  const configPath = getGlobalConfigPath()
  await mkdir(dirname(configPath), { recursive: true })
  await writeConfig(configPath, data)
}

async function readFrontmatterDescription(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8")
    const match = content.match(/^---\n([\s\S]*?)\n---/)
    if (!match) return ""
        const parsed = YAML.parse(match[1]) as Record<string, unknown>
    return (parsed.description as string) || ""
  } catch {
    return ""
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function discoverAgents(basePath: string): Promise<AgentsDiscovery> {
  const result: AgentsDiscovery = { workspace: [], global: [] }

  async function scanDir(dir: string, base: string, isGlobal: boolean): Promise<void> {
    if (!await fileExists(dir)) return
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        await scanDir(fullPath, base, isGlobal)
      } else if (entry.name === "SKILL.md" || entry.name.endsWith(".md")) {
        const relPath = relative(base, fullPath).replace(/\.md$/, "")
        const parts = relPath.split(sep)
        const name = parts.pop()!
        const directory = parts.join(sep) || "root"
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

  for (const agentDir of AGENT_SEARCH_DIRS) {
    const fullPath = join(basePath, agentDir)
    await scanDir(fullPath, fullPath, false)
  }

  for (const globalPath of GLOBAL_AGENT_DIRS) {
    await scanDir(globalPath, globalPath, true)
  }

  return result
}

export async function discoverSkills(basePath: string): Promise<SkillsDiscovery> {
  const result: SkillsDiscovery = { workspace: [], global: [] }

  async function scanDir(dir: string, base: string, isGlobal: boolean): Promise<void> {
    if (!await fileExists(dir)) return
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        const skillMdPath = join(fullPath, "SKILL.md")
        if (await fileExists(skillMdPath)) {
          const relPath = relative(base, fullPath)
          const parts = relPath.split(sep)
          const name = parts.pop()!
          const directory = parts.join(sep) || "root"
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

export async function discoverGlobalSkills(): Promise<SkillsDiscovery> {
  const result: SkillsDiscovery = { workspace: [], global: [] }

  async function scanDir(dir: string, base: string): Promise<void> {
    if (!await fileExists(dir)) return
    const entries = await readdir(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory()) {
        const skillMdPath = join(fullPath, "SKILL.md")
        if (await fileExists(skillMdPath)) {
          const relPath = relative(base, fullPath)
          const parts = relPath.split(sep)
          const name = parts.pop()!
          const directory = parts.join(sep) || "root"
          const description = await readFrontmatterDescription(skillMdPath)

          const item: DiscoveredItem = { name, fullPath: relPath, directory, description }
          result.global.push(item)
        } else {
          await scanDir(fullPath, base)
        }
      }
    }
  }

  for (const skillPath of GLOBAL_SKILL_DIRS) {
    await scanDir(skillPath, skillPath)
  }
  return result
}

export async function initializeNewProjectSkills(workspacePath: string): Promise<void> {
  const skills = await discoverSkills(workspacePath)
  const globalSkills = await discoverGlobalSkills()
  const configPath = await findOpencodeConfig(workspacePath)

  if (!configPath) {
    throw new Error("Workspace has no opencode config")
  }

  const config = await readConfig(configPath)

  if (!config.permission) {
    config.permission = {}
  }
  const perm = config.permission as Record<string, Record<string, unknown>>
  if (!perm.skill) {
    perm.skill = {}
  }

  perm.skill['*'] = 'deny'

  const allSkills = [
    ...skills.workspace,
    ...globalSkills.global.filter(s => !skills.workspace.some(w => w.fullPath === s.fullPath))
  ]

  for (const skill of allSkills) {
    perm.skill[skill.name] = 'allow'
  }

  await writeConfig(configPath, config)
}

export async function discoverPlugins(basePath: string): Promise<string[]> {
  const plugins: Set<string> = new Set()

  for (const pluginDir of PLUGIN_SEARCH_DIRS) {
    const fullPath = join(basePath, pluginDir)
    try {
      const entries = await readdir(fullPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isFile() && (entry.name.endsWith(".js") || entry.name.endsWith(".ts"))) {
          plugins.add(entry.name.replace(/\.(js|ts)$/, ""))
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return Array.from(plugins).sort()
}
