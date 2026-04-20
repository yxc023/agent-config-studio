import { app } from "electron"
import { join } from "node:path"
import { homedir } from "node:os"

export const WORKSPACE_CONFIG_MANAGER_APP_ID = "ai.opencode.workspace-config-manager"

export const APP_NAME = "OpenCode Workspace Config Manager"

export const SETTINGS_STORE = "workspace-config-manager.settings"

export const PROFILES_DIR = join(homedir(), ".config", "opencode-manager", "profiles")

export const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode")

export const GLOBAL_CONFIG_FILE = "opencode.jsonc"

export const SKILL_SEARCH_DIRS = [".opencode/skills", ".claude/skills", ".agents/skills"]
