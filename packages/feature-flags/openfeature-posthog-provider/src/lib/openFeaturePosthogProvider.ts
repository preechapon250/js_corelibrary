import type { EvaluationContext, JsonValue, Logger, Provider, ResolutionDetails } from "@openfeature/web-sdk"
import type { PostHog } from "posthog-js"
import { ErrorCode } from "@openfeature/web-sdk"

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
    const value = this.client.isFeatureEnabled(flagKey)
    if (value === undefined) {
      return { value: defaultValue, errorCode: ErrorCode.FLAG_NOT_FOUND }
    }
    return { value: value }
  }

  resolveStringEvaluation(
    flagKey: string,
    defaultValue: string,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<string> {
    const raw = this.client.getFeatureFlag(flagKey)
    if (raw === undefined) {
      console.error("Error evaluating feature flag", flagKey)
      return { value: defaultValue, errorCode: ErrorCode.FLAG_NOT_FOUND }
    }
    const value = typeof raw === "string" ? raw : String(raw)
    return { value }
  }

  resolveNumberEvaluation(
    flagKey: string,
    defaultValue: number,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<number> {
    const raw = this.client.getFeatureFlag(flagKey)
    if (raw === undefined) {
      return { value: defaultValue, errorCode: ErrorCode.FLAG_NOT_FOUND }
    }
    const num = Number(raw)
    if (Number.isNaN(num)) {
      return { value: defaultValue, errorCode: ErrorCode.TYPE_MISMATCH }
    }
    return { value: num }
  }

  resolveObjectEvaluation<T extends JsonValue>(
    flagKey: string,
    defaultValue: T,
    _context: EvaluationContext,
    _logger: Logger,
  ): ResolutionDetails<T> {
    const payload = this.client.getFeatureFlagPayload(flagKey)
    if (payload === undefined || payload === null) {
      return { value: defaultValue, errorCode: ErrorCode.FLAG_NOT_FOUND }
    }
    const value = payload as T
    return { value }
  }
}
