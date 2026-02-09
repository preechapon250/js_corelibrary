import { ComponentType, ReactNode, useMemo } from "react"
import { toUpperFirst } from "@leancodepl/utils"
import {
  getAllOidcProviderUiNodes,
  isOidcProviderInConfig,
  OidcProviderComponents,
  OidcProvidersConfig,
} from "../../../utils"
import { useGetSettingsFlow } from "../hooks"
import { Oidc } from "./fields"
import { getOidcProviderType } from "./providers"

export type OidcFormProps<TOidcProvidersConfig extends OidcProvidersConfig = readonly []> =
  OidcProviderComponents<TOidcProvidersConfig> & {
    isLoading: boolean
  }

type OidcFormWrapperProps<TOidcProvidersConfig extends OidcProvidersConfig = readonly []> = {
  oidcForm: ComponentType<OidcFormProps<TOidcProvidersConfig>>
  oidcProvidersConfig?: TOidcProvidersConfig
}

export function OidcFormWrapper<TOidcProvidersConfig extends OidcProvidersConfig = readonly []>({
  oidcForm: OidcForm,
  oidcProvidersConfig,
}: OidcFormWrapperProps<TOidcProvidersConfig>) {
  const { data: settingsFlow } = useGetSettingsFlow()

  const oidcComponents = useMemo<OidcFormProps<TOidcProvidersConfig>>(() => {
    if (!settingsFlow)
      return {
        isLoading: true,
      }

    const availableProviders = getAllOidcProviderUiNodes(settingsFlow.ui.nodes)
    const components: OidcProviderComponents<TOidcProvidersConfig> = {}

    availableProviders.forEach(node => {
      const providerId = node.attributes.value
      const type = getOidcProviderType(providerId, settingsFlow.ui.nodes)

      if (type && isOidcProviderInConfig(oidcProvidersConfig, providerId)) {
        const providerName = toUpperFirst(providerId)

        components[providerName] = ({ children }: { children: ReactNode }) => (
          <Oidc provider={providerId} type={type}>
            {children}
          </Oidc>
        )
      }
    })

    return {
      isLoading: false,
      ...components,
    }
  }, [settingsFlow, oidcProvidersConfig])

  return <OidcForm {...oidcComponents} />
}
