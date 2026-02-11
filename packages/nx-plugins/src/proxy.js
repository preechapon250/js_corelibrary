import { createNodesFromFiles } from "@nx/devkit"
import { dirname } from "node:path"

const dockerComposeGlob = "**/dev/docker-compose.yml"

export const name = "@leancodepl/nx-plugins/proxy"

export const createNodesV2 = [
  dockerComposeGlob,
  async (configFiles, options, context) =>
    createNodesFromFiles(
      (configFile, options) => createNodesInternal(configFile, options ?? {}),
      configFiles,
      options,
      context,
    ),
]

function createNodesInternal(configFilePath, options) {
  const dockerComposeDir = dirname(configFilePath)
  const targetName = options.targetName ?? "proxy"

  const proxyTarget = {
    executor: "nx:run-commands",
    defaultConfiguration: "up",
    options: {
      cwd: dockerComposeDir,
    },
    configurations: {
      up: {
        command: "docker compose up proxy",
      },
      rebuild: {
        command:
          "az acr login -n leancode && docker pull leancode.azurecr.io/traefik-proxy && docker compose build --no-cache proxy",
      },
    },
  }

  return {
    projects: {
      "": {
        targets: {
          [targetName]: proxyTarget,
        },
      },
    },
  }
}
