import type {
  EvaluationContext,
  JsonValue,
  Logger,
  Provider,
  ResolutionDetails,
} from "@openfeature/web-sdk"
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
    const result = this.client.getFeatureFlagResult(flagKey)
    if (result === undefined) {
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

    if (flagType === "boolean") {
      return {
        value: result.enabled as T,
        ...(variant && { variant }),
        reason,
      }
    }

    if (flagType === "object") {
      const payload = result.payload
      if (payload === undefined || payload === null) {
        return {
          value: defaultValue,
          errorCode: ErrorCode.FLAG_NOT_FOUND,
          reason: StandardResolutionReasons.ERROR,
        }
      }
      try {
        const value = typeof payload === "string" ? (JSON.parse(payload) as T) : (payload as T)
        return {
          value,
          ...(variant && { variant }),
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

    if (flagType === "string") {
      const value = result.variant ?? (result.enabled ? "true" : "false")
      return {
        value: (typeof value === "string" ? value : String(value)) as T,
        ...(variant && { variant }),
        reason,
      }
    }

    const raw = result.variant ?? (result.enabled ? "1" : "0")
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
      ...(variant && { variant }),
      reason,
    }
  }
}
