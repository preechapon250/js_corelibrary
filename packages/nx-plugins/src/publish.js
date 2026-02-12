import {
  createNodesFromFiles,
  joinPathFragments,
} from "@nx/devkit"
import { readFileSync } from "node:fs"
import { dirname, join } from "node:path"

/**
 * @typedef {object} PublishPluginOptions
 * @property {string} [targetName]
 * @property {string} [publishScriptPath]
 */

const packageJsonGlob = "**/package.json"

export const name = "@leancodepl/nx-plugins/publish"

/** @type {import("@nx/devkit").CreateNodesV2<PublishPluginOptions>} */
export const createNodesV2 = [
  packageJsonGlob,
  async (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile, opts, ctx) => createNodesInternal(configFile, opts ?? {}, ctx),
      configFiles,
      options,
      context,
    ),
]

/**
 * @param {string} packageJsonPath
 * @param {PublishPluginOptions} options
 * @param {import("@nx/devkit").CreateNodesContextV2} context
 */
function createNodesInternal(packageJsonPath, options, context) {
  const projectRoot = dirname(packageJsonPath)
  const packageJsonFullPath = join(context.workspaceRoot, packageJsonPath)

  let pkg
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

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const publishTarget = {
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
