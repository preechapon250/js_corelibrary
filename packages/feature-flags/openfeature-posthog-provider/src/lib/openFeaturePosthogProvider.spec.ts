import { ErrorCode } from "@openfeature/web-sdk"
import { beforeEach, describe, expect, it, vi } from "vitest"
import type { PostHog } from "posthog-js"
import { OpenFeaturePosthogProvider } from "./openFeaturePosthogProvider.js"

function createMockClient(overrides: Partial<PostHog> = {}): PostHog {
  return {
    isFeatureEnabled: vi.fn(),
    getFeatureFlag: vi.fn(),
    getFeatureFlagPayload: vi.fn(),
    ...overrides,
  } as unknown as PostHog
}

const mockLogger = {} as Parameters<OpenFeaturePosthogProvider["resolveBooleanEvaluation"]>[3]
const emptyContext = {} as Parameters<OpenFeaturePosthogProvider["resolveBooleanEvaluation"]>[2]

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
      vi.mocked(client.isFeatureEnabled).mockReturnValue(true)

      const result = provider.resolveBooleanEvaluation("flag-a", false, emptyContext, mockLogger)

      expect(result).toEqual({ value: true })
      expect(client.isFeatureEnabled).toHaveBeenCalledWith("flag-a")
    })

    it("returns flag value when disabled", () => {
      vi.mocked(client.isFeatureEnabled).mockReturnValue(false)

      const result = provider.resolveBooleanEvaluation("flag-b", true, emptyContext, mockLogger)

      expect(result).toEqual({ value: false })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      vi.mocked(client.isFeatureEnabled).mockReturnValue(undefined)

      const result = provider.resolveBooleanEvaluation("missing", true, emptyContext, mockLogger)

      expect(result).toEqual({ value: true, errorCode: ErrorCode.FLAG_NOT_FOUND })
    })
  })

  describe("resolveStringEvaluation", () => {
    it("returns string value when flag is a string", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue("variant-a")

      const result = provider.resolveStringEvaluation("flag-a", "default", emptyContext, mockLogger)

      expect(result).toEqual({ value: "variant-a" })
      expect(client.getFeatureFlag).toHaveBeenCalledWith("flag-a")
    })

    it("converts non-string values to string", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue("42")

      const result = provider.resolveStringEvaluation("flag-a", "default", emptyContext, mockLogger)

      expect(result).toEqual({ value: "42" })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {})
      vi.mocked(client.getFeatureFlag).mockReturnValue(undefined)

      const result = provider.resolveStringEvaluation("missing", "fallback", emptyContext, mockLogger)

      expect(result).toEqual({ value: "fallback", errorCode: ErrorCode.FLAG_NOT_FOUND })
      expect(consoleSpy).toHaveBeenCalledWith("Error evaluating feature flag", "missing")
      consoleSpy.mockRestore()
    })
  })

  describe("resolveNumberEvaluation", () => {
    it("returns number value when flag is a number", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue("42")

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({ value: 42 })
    })

    it("parses string numbers", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue("100")

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({ value: 100 })
    })

    it("returns default and FLAG_NOT_FOUND when flag is undefined", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue(undefined)

      const result = provider.resolveNumberEvaluation("missing", 10, emptyContext, mockLogger)

      expect(result).toEqual({ value: 10, errorCode: ErrorCode.FLAG_NOT_FOUND })
    })

    it("returns default and TYPE_MISMATCH when value is not a valid number", () => {
      vi.mocked(client.getFeatureFlag).mockReturnValue("not-a-number")

      const result = provider.resolveNumberEvaluation("flag-a", 0, emptyContext, mockLogger)

      expect(result).toEqual({ value: 0, errorCode: ErrorCode.TYPE_MISMATCH })
    })
  })

  describe("resolveObjectEvaluation", () => {
    it("returns payload when flag has payload", () => {
      const payload = { variant: "a", config: { key: "value" } }
      vi.mocked(client.getFeatureFlagPayload).mockReturnValue(payload)

      const result = provider.resolveObjectEvaluation("flag-a", {}, emptyContext, mockLogger)

      expect(result).toEqual({ value: payload })
      expect(client.getFeatureFlagPayload).toHaveBeenCalledWith("flag-a")
    })

    it("returns default and FLAG_NOT_FOUND when payload is undefined", () => {
      vi.mocked(client.getFeatureFlagPayload).mockReturnValue(undefined)

      const result = provider.resolveObjectEvaluation("missing", { default: true }, emptyContext, mockLogger)

      expect(result).toEqual({ value: { default: true }, errorCode: ErrorCode.FLAG_NOT_FOUND })
    })

    it("returns default and FLAG_NOT_FOUND when payload is null", () => {
      vi.mocked(client.getFeatureFlagPayload).mockReturnValue(null)

      const result = provider.resolveObjectEvaluation("missing", { default: true }, emptyContext, mockLogger)

      expect(result).toEqual({ value: { default: true }, errorCode: ErrorCode.FLAG_NOT_FOUND })
    })
  })
})
