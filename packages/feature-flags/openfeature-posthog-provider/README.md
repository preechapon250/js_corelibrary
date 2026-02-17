# openfeature-posthog-provider

OpenFeature provider that delegates feature flag evaluation to PostHog. Use PostHog feature flags through the OpenFeature standard API.

## Installation

```bash
npm install @leancodepl/openfeature-posthog-provider
```

## API

### `OpenFeaturePosthogProvider(client)`

Delegates feature flag evaluation to PostHog (posthog-js). Use this to access PostHog feature flags through the OpenFeature standard API. Flags return default values until PostHog has loaded and feature flags are available.

**Parameters:**

- `client` - `PostHog` - Initialized PostHog client instance

## Usage Examples

### Basic setup with OpenFeature

```typescript
import posthog from 'posthog-js';
import { OpenFeature } from '@openfeature/web-sdk';
import { OpenFeaturePosthogProvider } from '@leancodepl/openfeature-posthog-provider';

posthog.init('YOUR_API_KEY');
const provider = new OpenFeaturePosthogProvider(posthog);
OpenFeature.setProvider(provider);

const client = OpenFeature.getClient();
const isEnabled = await client.getBooleanValue('my-feature', false);
console.log(isEnabled);
```

### Evaluating different flag types

```typescript
const stringValue = await client.getStringValue('welcome-message', 'Hello');
const numberValue = await client.getNumberValue('max-items', 10);
const jsonValue = await client.getObjectValue('config', { theme: 'light' });
```
