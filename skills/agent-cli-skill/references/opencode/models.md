# OpenCode Models and Providers

OpenCode uses the AI SDK and Models.dev to support hosted providers and local
models. Popular providers are preloaded; credentials added with `/connect`
become available when OpenCode starts.

Treat provider/model availability and recommended-model lists as changing
catalog data. Check the active provider catalog or Models.dev when exact current
IDs matter.

## Connect and select

1. Configure credentials with `/connect`.
2. Open the model picker with:

```text
/models
```

3. Select an available model from the configured providers.

Model IDs use this format:

```text
provider_id/model_id
```

Examples:

```text
lmstudio/google/gemma-3n-e4b
opencode/gpt-5.1-codex
anthropic/claude-sonnet-4-20250514
```

For a custom provider:

- `provider_id` is the key under `provider` in `opencode.json`.
- `model_id` is the key under that provider's `models` object.

Always use the IDs exposed by the configured provider; display names are not
necessarily valid config IDs.

## Recommended-model snapshot

The supplied OpenCode documentation lists these as models that work well for
both coding and tool calling, in no particular order:

- GPT 5.2
- GPT 5.1 Codex
- Claude Opus 4.5
- Claude Sonnet 4.5
- Minimax M2.1
- Gemini 3 Pro

This list is explicitly non-exhaustive and may be outdated. Do not present it as
a current ranking without checking the live catalog and current documentation.

## Set the default model

Set the top-level `model` key in `opencode.json`:

```json
{
  "$schema": "https://opencode.ai/config.json",
  "model": "lmstudio/google/gemma-3n-e4b"
}
```

The value must be the full `provider_id/model_id`.

A CLI override uses the same format:

```bash
opencode --model anthropic/claude-sonnet-4-20250514
opencode -m anthropic/claude-sonnet-4-20250514
```

## Configure model options globally

Configure built-in or custom model options under
`provider.<provider-id>.models.<model-id>.options`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "models": {
        "gpt-5": {
          "options": {
            "reasoningEffort": "high",
            "textVerbosity": "low",
            "reasoningSummary": "auto",
            "include": ["reasoning.encrypted_content"]
          }
        }
      }
    },
    "anthropic": {
      "models": {
        "claude-sonnet-4-5-20250929": {
          "options": {
            "thinking": {
              "type": "enabled",
              "budgetTokens": 16000
            }
          }
        }
      }
    }
  }
}
```

Option names and accepted values are provider/model-specific. Common examples
include:

| Provider family | Example options |
|---|---|
| OpenAI | `reasoningEffort`, `textVerbosity`, `reasoningSummary`, `include` |
| Anthropic | `thinking.type`, `thinking.budgetTokens` |

Agent-level model options override these global model options. For agent config,
also read `subagents.md`.

The documentation examples may use different dated model IDs in nearby prose
and code. Resolve such differences in favor of the actual ID exposed by the
provider catalog rather than copying an example blindly.

## Variants

Variants provide named configurations for one model without duplicating model
entries. OpenCode ships with built-in variants for many popular providers and
allows custom variants.

### Common built-in variants

The exact set depends on the provider and model. The supplied documentation
gives these broad conventions:

| Provider | Typical variants |
|---|---|
| Anthropic | `high` (high thinking budget, default), `max` (maximum budget) |
| OpenAI | `none`, `minimal`, `low`, `medium`, `high`, `xhigh` |
| Google | `low`, `high` |

Other providers may expose additional defaults. Inspect the variants available
for the selected model instead of assuming this table is exhaustive.

### Define or override variants

Add `variants` beneath a model. Variant values are the option object directly;
they are not nested beneath `options`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "opencode": {
      "models": {
        "gpt-5": {
          "variants": {
            "high": {
              "reasoningEffort": "high",
              "textVerbosity": "low",
              "reasoningSummary": "auto"
            },
            "low": {
              "reasoningEffort": "low",
              "textVerbosity": "low",
              "reasoningSummary": "auto"
            }
          }
        }
      }
    }
  }
}
```

A custom name can add a new variant. Reusing a built-in name overrides it.
Disable an unwanted variant with `disabled: true`:

```jsonc
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "openai": {
      "models": {
        "gpt-5": {
          "variants": {
            "thinking": {
              "reasoningEffort": "high",
              "textVerbosity": "low"
            },
            "fast": {
              "disabled": true
            }
          }
        }
      }
    }
  }
}
```

Use the `variant_cycle` keybind to switch quickly between variants.

## Model loading priority

At startup, OpenCode chooses a model in this order:

1. `--model` or `-m` CLI flag.
2. Top-level `model` in OpenCode config.
3. Last used model.
4. First model selected by OpenCode's internal priority.

The CLI and config values both use `provider_id/model_id`.

## OpenAI-compatible relays: protocol and User-Agent gates

When a relay works in Codex but fails in OpenCode, do not assume the API key or
model is wrong. Compare the actual request path and client identity first.

### 1. Confirm the wire protocol

These provider packages target different OpenAI-style endpoints:

| Relay endpoint | OpenCode provider package |
|---|---|
| `/v1/responses` | `@ai-sdk/openai` |
| `/v1/chat/completions` | `@ai-sdk/openai-compatible` |

A Responses-only relay configured with `@ai-sdk/openai-compatible` sends the
request to the wrong route. Confirm the URL in the OpenCode log instead of
inferring it from `baseURL`:

```bash
rg -n 'service=llm|statusCode|/responses|/chat/completions' \
  ~/.local/share/opencode/log/*.log
```

After changing the package, restart OpenCode and verify that the new log entry
uses the intended path. A correct path with the same error means the protocol
fix worked but was not the only failure.

### 2. Compare credentials without exposing them

If Codex works against the same relay, compare key lengths and hashes rather
than printing raw secrets. Also compare the exact base URL and model ID. Never
paste API keys into logs, issue reports, or skill output.

```python
import hashlib

print(len(key), hashlib.sha256(key.encode()).hexdigest()[:16])
```

Matching hashes rule out accidental key drift; they do not prove that the relay
accepts both clients.

### 3. Detect a User-Agent allowlist

An HTML `403 Forbidden` generated by nginx or another gateway often indicates
an edge/WAF/client-policy rejection rather than a model-level JSON error. Use a
minimal, non-streaming request and change only `User-Agent`:

1. Send the same URL, key, model, and body with a generic User-Agent.
2. Repeat with the working client's User-Agent.
3. Treat `generic -> 403` and `working client -> 200` as evidence of a
   User-Agent allowlist.

Keep the diagnostic prompt and output limit tiny because both successful probes
may consume quota. Do not broaden the test to multiple models until this single
variable is resolved.

### 4. Verify whether OpenCode preserves a custom User-Agent

Do not assume this config overrides the runtime header:

```jsonc
{
  "options": {
    "headers": {
      "User-Agent": "codex_cli_rs/<version>"
    }
  }
}
```

In OpenCode 1.14.25, a local capture showed that arbitrary custom headers were
preserved, but `User-Agent` was replaced with an OpenCode/AI SDK/runtime value.
Treat this as version-specific behavior and re-test after upgrades. A loopback
HTTP capture is safer and more conclusive than trusting the config file.

### 5. Choose the fix at the correct layer

Preferred order:

1. Ask the relay operator to allow OpenCode's User-Agent or remove the
   client-specific gate.
2. Use a relay that explicitly supports OpenCode and the required endpoint.
3. If policy permits, place a local reverse proxy in front of the relay and
   rewrite only `User-Agent`; preserve `Authorization`, request paths, streaming,
   TLS SNI, and the upstream `Host` header.

Changing `reasoningEffort`, variants, model display names, or the API key cannot
fix a gateway policy that rejects the client before the request reaches the
model service.

### Relay debugging decision table

| Observation | Likely layer | Next check |
|---|---|---|
| `/chat/completions` used for a Responses-only relay | Provider package/protocol | Switch to `@ai-sdk/openai`, restart, inspect the new URL |
| Correct `/responses`, JSON 401/403 | Authentication/account policy | Key, account, model entitlement, provider response body |
| Correct `/responses`, HTML nginx 403 | Gateway/WAF/client policy | Controlled User-Agent comparison |
| Custom header appears but custom User-Agent does not | Client runtime header override | Local capture, provider allowlist, or rewriting proxy |
| Generic User-Agent fails and Codex User-Agent succeeds | User-Agent allowlist | Provider-side allowlist is the preferred fix |

## Troubleshooting

| Symptom | Check |
|---|---|
| Model is absent from `/models` | Provider credentials, provider config, and restart/startup state |
| “Unknown model” or lookup failure | Exact provider/model keys; do not use only the display name |
| Options have no effect | Option support for that provider/model and agent-level overrides |
| Unexpected model selected | CLI `-m`/`--model`, config `model`, then last-used state |
| Variant missing | Correct model entry, variant spelling, and `disabled` state |
| Local model unavailable | Local provider process, endpoint/config, and model ID |
| Relay works in Codex but returns HTML 403 in OpenCode | Actual endpoint, key hash, and controlled User-Agent comparison |

## Checklist

1. Connect or configure the provider before selecting a model.
2. Use the exact `provider_id/model_id` from the active catalog.
3. Set a top-level `model` only when a stable default is desired.
4. Put shared options under the provider model's `options` object.
5. Expect agent-level options to override global model options.
6. Put variant settings directly under `variants.<name>`.
7. Treat built-in variants and recommended models as provider/catalog-dependent.
8. Check CLI flags first when debugging unexpected model selection.
9. For relay failures, verify the actual request path before changing credentials.
10. Treat gateway-generated HTML 403 separately from provider JSON errors.
11. Verify custom User-Agent behavior with a local capture instead of trusting config alone.
