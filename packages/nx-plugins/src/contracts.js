import {
  createNodesFromFiles,
  joinPathFragments,
} from "@nx/devkit"
import { dirname } from "node:path"

const contractsConfigGlob = "**/contractsgenerator-typescript.config.js"

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

function createNodesInternal(configFilePath, options, _context) {
  const projectRoot = dirname(configFilePath)
  const targetName = options.targetName ?? "contracts"

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
