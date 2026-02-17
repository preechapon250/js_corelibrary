import type { PostHog } from "posthog-js"
import { ErrorCode, OpenFeature, StandardResolutionReasons } from "@openfeature/web-sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { OpenFeaturePosthogProvider } from "./openFeaturePosthogProvider.js"

function createMockClient(overrides: Partial<PostHog> = {}): PostHog {
  const getFeatureFlagResult = vi.fn()
  return {
    getFeatureFlagResult,
    getFeatureFlag: vi.fn((key: string) => {
      const result = getFeatureFlagResult(key)
      return result ? (result.variant ?? result.enabled) : undefined
    }),
    ...overrides,
  } as unknown as PostHog
}

const emptyContext = {} as Parameters<OpenFeaturePosthogProvider["resolveBooleanEvaluation"]>[2]
const mockLogger = {} as Parameters<OpenFeaturePosthogProvider["resolveBooleanEvaluation"]>[3]

describe("OpenFeaturePosthogProvider", () => {
  let provider: OpenFeaturePosthogProvider
  let client: PostHog

  beforeEach(() => {
    client = createMockClient()
    provider = new OpenFeaturePosthogProvider(client)
  })

  it("exposes metadata and runsOn", () => {
    expect(provider.metadata).toEqual({ name: "PostHog" })
    expect(provider.runsOn).toBe("client")
  })

  describe("resolveBooleanEvaluation", () => {
    it("returns flag value when enabled", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: undefined,
        payload: undefined,
      })

      const result = provider.resolveBooleanEvaluation("flag-a", false, emptyContext, mockLogger)

      expect(result).toEqual({
        value: true,
        reason: StandardResolutionReasons.STATIC,
      })
      expect(client.getFeatureFlag).toHaveBeenCalledWith("flag-a")
    })

    it("returns flag value when disabled", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-b",
        enabled: false,
        variant: undefined,
        payload: undefined,
      })

      const result = provider.resolveBooleanEvaluation("flag-b", true, emptyContext, mockLogger)

      expect(result).toEqual({
        value: false,
        reason: StandardResolutionReasons.DISABLED,
      })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue(undefined)

      const result = provider.resolveBooleanEvaluation("missing", true, emptyContext, mockLogger)

      expect(result).toEqual({
        value: true,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      })
    })
  })

  describe("resolveStringEvaluation", () => {
    it("returns string value when flag is a string", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: "variant-a",
        payload: undefined,
      })

      const result = provider.resolveStringEvaluation("flag-a", "default", emptyContext, mockLogger)

      expect(result).toEqual({
        value: "variant-a",
        reason: StandardResolutionReasons.TARGETING_MATCH,
      })
      expect(client.getFeatureFlag).toHaveBeenCalledWith("flag-a")
    })

    it("converts non-string values to string", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: "42",
        payload: undefined,
      })

      const result = provider.resolveStringEvaluation("flag-a", "default", emptyContext, mockLogger)

      expect(result).toEqual({
        value: "42",
        reason: StandardResolutionReasons.TARGETING_MATCH,
      })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue(undefined)

      const result = provider.resolveStringEvaluation("missing", "fallback", emptyContext, mockLogger)

      expect(result).toEqual({
        value: "fallback",
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      })
    })
  })

  describe("resolveNumberEvaluation", () => {
    it("returns number value when flag is a number", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: "42",
        payload: undefined,
      })

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({
        value: 42,
        reason: StandardResolutionReasons.TARGETING_MATCH,
      })
    })

    it("parses string numbers", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: "100",
        payload: undefined,
      })

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({
        value: 100,
        reason: StandardResolutionReasons.TARGETING_MATCH,
      })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue(undefined)

      const result = provider.resolveNumberEvaluation("missing", 10, emptyContext, mockLogger)

      expect(result).toEqual({
        value: 10,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      })
    })

    it("returns default and TYPE_MISMATCH when value is not a valid number", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: "not-a-number",
        payload: undefined,
      })

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({
        value: 0,
        errorCode: ErrorCode.TYPE_MISMATCH,
        reason: StandardResolutionReasons.ERROR,
      })
    })
  })

  describe("resolveObjectEvaluation", () => {
    it("returns payload when flag has payload", () => {
      const payload = { variant: "a", config: { key: "value" } }
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: undefined,
        payload,
      })

      const result = provider.resolveObjectEvaluation("flag-a", {}, emptyContext, mockLogger)

      expect(result).toEqual({
        value: payload,
        reason: StandardResolutionReasons.STATIC,
      })
      expect(client.getFeatureFlagResult).toHaveBeenCalledWith("flag-a")
    })

    it("returns default and FLAG_NOT_FOUND when payload is undefined", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "missing",
        enabled: true,
        variant: undefined,
        payload: undefined,
      })

      const result = provider.resolveObjectEvaluation("missing", { default: true }, emptyContext, mockLogger)

      expect(result).toEqual({
        value: { default: true },
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      })
    })

    it("returns default and FLAG_NOT_FOUND when payload is null", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "missing",
        enabled: true,
        variant: undefined,
        payload: null,
      })

      const result = provider.resolveObjectEvaluation("missing", { default: true }, emptyContext, mockLogger)

      expect(result).toEqual({
        value: { default: true },
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      })
    })

    it("parses JSON string payload before returning", () => {
      const payload = JSON.stringify({ variant: "a", config: { key: "value" } })
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: undefined,
        payload,
      })

      const result = provider.resolveObjectEvaluation("flag-a", {}, emptyContext, mockLogger)

      expect(result).toEqual({
        value: { variant: "a", config: { key: "value" } },
        reason: StandardResolutionReasons.STATIC,
      })
      expect(client.getFeatureFlagResult).toHaveBeenCalledWith("flag-a")
    })

    it("returns default and PARSE_ERROR when payload is invalid JSON string", () => {
      vi.mocked(client.getFeatureFlagResult).mockReturnValue({
        key: "flag-a",
        enabled: true,
        variant: undefined,
        payload: "invalid json",
      })

      const result = provider.resolveObjectEvaluation("flag-a", { default: true }, emptyContext, mockLogger)

      expect(result).toEqual({
        value: { default: true },
        errorCode: ErrorCode.PARSE_ERROR,
        reason: StandardResolutionReasons.ERROR,
      })
    })
  })

  describe("integration with OpenFeature client", () => {
    beforeEach(() => {
      OpenFeature.setProvider(provider)
    })

    describe("getBooleanValue", () => {
      it("getBooleanValue returns flag value when enabled", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "flag-a",
          enabled: true,
          variant: undefined,
          payload: undefined,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getBooleanValue("flag-a", false)

        expect(value).toBe(true)
        expect(client.getFeatureFlag).toHaveBeenCalledWith("flag-a")
      })

      it("getBooleanValue returns default when flag is disabled", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "flag-b",
          enabled: false,
          variant: undefined,
          payload: undefined,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getBooleanValue("flag-b", true)

        expect(value).toBe(false)
      })
    })

    describe("getStringValue", () => {
      it("returns flag value", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "flag-a",
          enabled: true,
          variant: "variant-a",
          payload: undefined,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getStringValue("flag-a", "default")

        expect(value).toBe("variant-a")
        expect(client.getFeatureFlag).toHaveBeenCalledWith("flag-a")
      })

      it("returns default when flag is undefined", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue(undefined)

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getStringValue("missing", "fallback")

        expect(value).toBe("fallback")
      })
    })

    describe("getNumberValue", () => {
      it("returns flag value", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "flag-a",
          enabled: true,
          variant: "42",
          payload: undefined,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getNumberValue("flag-a", 0)

        expect(value).toBe(42)
      })

      it("returns default when flag is undefined", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue(undefined)

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getNumberValue("missing", 10)

        expect(value).toBe(10)
      })
    })

    describe("getObjectValue", () => {
      it("returns payload", () => {
        const payload = { variant: "a", config: { key: "value" } }
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "flag-a",
          enabled: true,
          variant: undefined,
          payload,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getObjectValue("flag-a", {})

        expect(value).toEqual(payload)
        expect(client.getFeatureFlagResult).toHaveBeenCalledWith("flag-a")
      })

      it("returns default when payload is undefined", () => {
        vi.mocked(client.getFeatureFlagResult).mockReturnValue({
          key: "missing",
          enabled: true,
          variant: undefined,
          payload: undefined,
        })

        const ofClient = OpenFeature.getClient()
        const value = ofClient.getObjectValue("missing", { default: true })

        expect(value).toEqual({ default: true })
      })
    })
  })
})
