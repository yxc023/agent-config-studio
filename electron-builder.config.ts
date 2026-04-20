import type { Configuration } from "electron-builder"

const getBase = (): Configuration => ({
  artifactName: "opencode-workspace-config-manager-${os}-${arch}.${ext}",
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
    appId: "ai.opencode.workspace-config-manager",
    productName: "OpenCode Workspace Config Manager",
  }
}

export default getConfig()
