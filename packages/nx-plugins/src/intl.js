import {
  createNodesFromFiles,
  joinPathFragments,
} from "@nx/devkit"
import { dirname } from "node:path"

const intlConfigGlob = "**/intl.config.{js,cjs}"

export const name = "@leancodepl/nx-plugins/intl"

export const createNodesV2 = [
  intlConfigGlob,
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

  const localTargetName = options.localTargetName ?? "intl"
  const uploadTargetName = options.uploadTargetName ?? "intl-upload"
  const downloadTargetName = options.downloadTargetName ?? "intl-download"
  const syncTargetName = options.syncTargetName ?? "intl-sync"
  const diffTargetName = options.diffTargetName ?? "intl-diff"

  const baseOptions = {
    cwd: joinPathFragments("{projectRoot}"),
  }

  const localTarget = {
    command: "npx @leancodepl/intl local",
    options: baseOptions,
  }

  const uploadTarget = {
    command: "npx @leancodepl/intl upload",
    options: baseOptions,
  }

  const downloadTarget = {
    command: "npx @leancodepl/intl download",
    options: baseOptions,
  }

  const syncTarget = {
    command: "npx @leancodepl/intl sync",
    options: baseOptions,
  }

  const diffTarget = {
    command: "npx @leancodepl/intl diff",
    options: baseOptions,
  }

  return {
    projects: {
      [projectRoot]: {
        targets: {
          [localTargetName]: localTarget,
          [uploadTargetName]: uploadTarget,
          [downloadTargetName]: downloadTarget,
          [syncTargetName]: syncTarget,
          [diffTargetName]: diffTarget,
        },
      },
    },
  }
}
