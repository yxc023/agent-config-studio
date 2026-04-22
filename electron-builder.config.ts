import type { Configuration } from "electron-builder"

const getBase = (): Configuration => ({
  artifactName: "agent-config-studio-${os}-${arch}.${ext}",
  directories: {
    output: "dist",
    buildResources: "resources",
  },
  files: ["out/**/*"],
  mac: {
    category: "public.app-category.developer-tools",
    target: ["dmg", "zip"],
  },
  win: {
    target: ["nsis"],
  },
  linux: {
    category: "Development",
    target: ["AppImage"],
  },
})

function getConfig() {
  const base = getBase()
  return {
    ...base,
    appId: "ai.agentconfigstudio",
    productName: "Agent Config Studio",
  }
}

export default getConfig()
