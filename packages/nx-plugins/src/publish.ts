import {
  CreateNodesContextV2,
  createNodesFromFiles,
  CreateNodesV2,
  joinPathFragments,
  TargetConfiguration,
} from "@nx/devkit"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"

const packageJsonGlob = "**/package.json"

export interface PublishPluginOptions {
  targetName?: string
  publishScriptPath?: string
}

export const createNodesV2: CreateNodesV2<PublishPluginOptions> = [
  packageJsonGlob,
  async (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile, opts, ctx) => createNodesInternal(configFile, opts ?? {}, ctx),
      configFiles,
      options,
      context,
    ),
]

function createNodesInternal(
  packageJsonPath: string,
  options: PublishPluginOptions,
  context: CreateNodesContextV2,
) {
  const projectRoot = dirname(packageJsonPath)
  const packageJsonFullPath = join(context.workspaceRoot, packageJsonPath)

  let pkg: { name?: string; files?: unknown }
  try {
    pkg = JSON.parse(readFileSync(packageJsonFullPath, "utf-8"))
  } catch {
    return { projects: {} }
  }

  if (!pkg.files || !Array.isArray(pkg.files) || pkg.files.length === 0) {
    return { projects: {} }
  }

  const packageName = pkg.name
  if (!packageName || typeof packageName !== "string") {
    return { projects: {} }
  }

  const targetName = options.targetName ?? "publish"
  const publishScriptPath = options.publishScriptPath ?? "tools/scripts/publish.mjs"

  const publishTarget: TargetConfiguration = {
    command: `node ${publishScriptPath} ${packageName} {args.registry} {args.ver} {args.tag}`,
    options: {
      cwd: joinPathFragments("{workspaceRoot}"),
    },
    dependsOn: ["build"],
  }

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [targetName]: publishTarget,
        },
      },
    },
  }
}
