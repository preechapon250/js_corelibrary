import type { EvaluationContext, JsonValue, Logger, Provider, ResolutionDetails } from "@openfeature/web-sdk"
import type { PostHog } from "posthog-js"
import { ErrorCode, StandardResolutionReasons } from "@openfeature/web-sdk"

type FlagType = "boolean" | "number" | "object" | "string"

/**
 * Delegates feature flag evaluation to PostHog (posthog-js). Use this to access
 * PostHog feature flags through the OpenFeature standard API. Flags return default
 * values until PostHog has loaded and feature flags are available.
 *
 * @param client - Initialized PostHog client instance
 * @example
 * ```typescript
 * import posthog from 'posthog-js';
 * import { OpenFeaturePosthogProvider } from '@leancodepl/openfeature-posthog-provider';
 *
 * posthog.init('YOUR_API_KEY');
 * const provider = new OpenFeaturePosthogProvider(posthog);
 * ```
 */
export class OpenFeaturePosthogProvider implements Provider {
  readonly metadata = {
    name: "PostHog",
  } as const

  readonly runsOn = "client" as const

  constructor(private readonly client: PostHog) {}

  resolveBooleanEvaluation(
    flagKey: string,
    defaultValue: boolean,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<boolean> {
    return this.evaluate(flagKey, defaultValue, "boolean")
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<string> {
    return this.evaluate(flagKey, defaultValue, "string")
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<number> {
    return this.evaluate(flagKey, defaultValue, "number")
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<T> {
    return this.evaluate(flagKey, defaultValue, "object") as ResolutionDetails<T>
  }

  private evaluate<T>(flagKey: string, defaultValue: T, flagType: FlagType): ResolutionDetails<T> {
    if (flagType === "object") {
      return this.evaluateObject(flagKey, defaultValue as JsonValue) as ResolutionDetails<T>
    }

    const value = this.client.getFeatureFlag(flagKey)
    if (value === undefined) {
      return {
        value: defaultValue,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      }
    }

    const variant = typeof value === "string" ? value : undefined
    const reason =
      variant !== undefined
        ? StandardResolutionReasons.TARGETING_MATCH
        : value
          ? StandardResolutionReasons.STATIC
          : StandardResolutionReasons.DISABLED

    if (flagType === "boolean") {
      return {
        value: !!value as T,
        reason,
      }
    }

    if (flagType === "string") {
      return {
        value: (typeof value === "string" ? value : String(value)) as T,
        reason,
      }
    }

    const raw = typeof value === "string" ? value : value ? "1" : "0"
    const num = Number(raw)
    if (Number.isNaN(num)) {
      return {
        value: defaultValue,
        errorCode: ErrorCode.TYPE_MISMATCH,
        reason: StandardResolutionReasons.ERROR,
      }
    }
    return {
      value: num as T,
      reason,
    }
  }

  private evaluateObject<T extends JsonValue>(flagKey: string, defaultValue: T): ResolutionDetails<T> {
    const result = this.client.getFeatureFlagResult(flagKey)
    if (result === undefined) {
      return {
        value: defaultValue,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      }
    }

    const payload = result.payload
    if (payload === undefined || payload === null) {
      return {
        value: defaultValue,
        errorCode: ErrorCode.FLAG_NOT_FOUND,
        reason: StandardResolutionReasons.ERROR,
      }
    }

    const variant = result.variant
    const reason = variant
      ? StandardResolutionReasons.TARGETING_MATCH
      : result.enabled
        ? StandardResolutionReasons.STATIC
        : StandardResolutionReasons.DISABLED

    try {
      const parsed = typeof payload === "string" ? JSON.parse(payload) : payload
      return {
        value: parsed as T,
        reason,
      }
    } catch {
      return {
        value: defaultValue,
        errorCode: ErrorCode.PARSE_ERROR,
        reason: StandardResolutionReasons.ERROR,
      }
    }
  }
}
