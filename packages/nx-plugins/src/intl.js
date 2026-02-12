import {
  createNodesFromFiles,
  joinPathFragments,
} from "@nx/devkit"
import { dirname } from "node:path"

/**
 * @typedef {object} IntlPluginOptions
 * @property {string} [localTargetName]
 * @property {string} [uploadTargetName]
 * @property {string} [downloadTargetName]
 * @property {string} [syncTargetName]
 * @property {string} [diffTargetName]
 */

const intlConfigGlob = "**/intl.config.{js,cjs}"

export const name = "@leancodepl/nx-plugins/intl"

/** @type {import("@nx/devkit").CreateNodesV2<IntlPluginOptions>} */
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

/**
 * @param {string} configFilePath
 * @param {IntlPluginOptions} options
 * @param {import("@nx/devkit").CreateNodesContextV2} _context
 */
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

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const localTarget = {
    command: "npx @leancodepl/intl local",
    options: baseOptions,
  }

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const uploadTarget = {
    command: "npx @leancodepl/intl upload",
    options: baseOptions,
  }

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const downloadTarget = {
    command: "npx @leancodepl/intl download",
    options: baseOptions,
  }

  /** @type {import("@nx/devkit").TargetConfiguration} */
  const syncTarget = {
    command: "npx @leancodepl/intl sync",
    options: baseOptions,
  }

  /** @type {import("@nx/devkit").TargetConfiguration} */
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
