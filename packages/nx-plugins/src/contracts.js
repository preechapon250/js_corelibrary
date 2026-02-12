import {
  createNodesFromFiles,
  joinPathFragments,
} from "@nx/devkit"
import { dirname } from "node:path"

/**
 * @typedef {object} ContractsPluginOptions
 * @property {string} [targetName]
 */

const contractsConfigGlob = "**/contractsgenerator-typescript.config.js"

export const name = "@leancodepl/nx-plugins/contracts"

/** @type {import("@nx/devkit").CreateNodesV2<ContractsPluginOptions>} */
export const createNodesV2 = [
  contractsConfigGlob,
  async (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile, options, context) => createNodesInternal(configFile, options ?? {}, context),
      configFiles,
      options,
      context,
    ),
]

/**
 * @param {string} configFilePath
 * @param {ContractsPluginOptions} options
 * @param {import("@nx/devkit").CreateNodesContextV2} _context
 */
function createNodesInternal(configFilePath, options, _context) {
  const projectRoot = dirname(configFilePath)
  const targetName = options.targetName ?? "contracts"

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const contractsTarget = {
    command: "npx @leancodepl/contractsgenerator-typescript --no-install",
    options: {
      cwd: joinPathFragments("{projectRoot}"),
    },
    cache: true,
  }

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [targetName]: contractsTarget,
        },
      },
    },
  }
}
