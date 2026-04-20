import type { ConfigData } from "./fileOps"

export function editJsonc(data: unknown, indent = 2): string {
  return JSON.stringify(data, null, indent)
}

export function mergeConfig(base: ConfigData, profile: ConfigData, sections: string[]): ConfigData {
  if (sections.includes("full")) return profile

  const result = { ...base }

  if (sections.includes("agents")) {
    if (profile.agent) {
      result.agent = { ...(base.agent || {}), ...profile.agent }
    }
  }

  if (sections.includes("plugins")) {
    const basePlugins = base.plugin || []
    const profilePlugins = profile.plugin || []
    result.plugin = [...basePlugins, ...profilePlugins.filter((p) => !basePlugins.includes(p))]
  }

  return result
}

export function diffConfigs(base: ConfigData, result: ConfigData): string[] {
  const changes: string[] = []

  const allKeys = new Set([...Object.keys(base), ...Object.keys(result)])

  for (const key of allKeys) {
    const baseVal = JSON.stringify(base[key])
    const resultVal = JSON.stringify(result[key])
    if (baseVal !== resultVal) {
      changes.push(`  ${key}: ${baseVal} → ${resultVal}`)
    }
  }

  return changes.length > 0 ? changes : ["No changes"]
}
