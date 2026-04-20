import { readFile, writeFile, readdir, mkdir, rm, rename, copyFile, access } from "node:fs/promises"
import { join, basename } from "node:path"
import { parse as parseJsonc, printParseErrorCode, type ParseError } from "jsonc-parser"
import { editJsonc } from "./jsonc"
import { GLOBAL_CONFIG_DIR, GLOBAL_CONFIG_FILE, SKILL_SEARCH_DIRS } from "./constants"

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

export async function discoverSkills(workspacePath: string): Promise<string[]> {
  const skills: Set<string> = new Set()
  const gitRoot = await findGitRoot(workspacePath)
  if (!gitRoot) return []

  for (const skillDir of SKILL_SEARCH_DIRS) {
    const fullPath = join(gitRoot, skillDir)
    try {
      const entries = await readdir(fullPath, { withFileTypes: true })
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = join(fullPath, entry.name, "SKILL.md")
          try {
            await access(skillPath)
            skills.add(entry.name)
          } catch {
            // SKILL.md not found in this directory
          }
        }
      }
    } catch {
      // Directory doesn't exist, skip
    }
  }

  return Array.from(skills).sort()
}

async function findGitRoot(dirPath: string): Promise<string | null> {
  let current = dirPath
  while (current !== "/") {
    try {
      await access(join(current, ".git"))
      return current
    } catch {
      const parent = dirname(current)
      if (parent === current) break
      current = parent
    }
  }
  return null
}
