# Codex GitHub Action

Use `openai/codex-action@v1` to run Codex in GitHub Actions for CI review, repeatable repository tasks, patch generation, release preparation, and quality gates. The action installs Codex CLI, optionally starts a Responses API proxy when an OpenAI API key is supplied, and runs `codex exec` with the requested controls.

## When to use it

| Need | Prefer |
|---|---|
| Run Codex in GitHub-hosted CI without installing the CLI yourself | Codex GitHub Action |
| Call Codex from a server-side TypeScript/Python application | `sdk.md` |
| Run a local/scripted one-shot Codex task outside GitHub Actions | Codex CLI non-interactive mode |
| Expose Codex as tools to a broader agent orchestrator | `mcp-server.md` |

## Prerequisites

1. Check out the repository before invoking Codex.
2. Store the OpenAI key in a GitHub secret such as `OPENAI_API_KEY`; never put it directly in workflow YAML.
3. Use a Linux or macOS runner when possible. Windows requires `safety-strategy: unsafe`.
4. Supply exactly one prompt source: `prompt` or `prompt-file`.
5. Give the workflow and Codex only the permissions required by the task.
6. Keep prompts in a stable repository path such as `.github/codex/prompts/` when they should be reviewed and versioned.

## Pull-request review workflow

This pattern checks out the PR merge commit, runs a read-only Codex review, exposes the final response as a job output, and posts it in a separate job.

```yaml
name: Codex pull request review

on:
  pull_request:
    types: [opened, synchronize, reopened]

jobs:
  codex:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    outputs:
      final_message: ${{ steps.run_codex.outputs.final-message }}
    steps:
      - uses: actions/checkout@v5
        with:
          ref: refs/pull/${{ github.event.pull_request.number }}/merge
          fetch-depth: 0
          persist-credentials: false

      - name: Run Codex
        id: run_codex
        uses: openai/codex-action@v1
        with:
          openai-api-key: ${{ secrets.OPENAI_API_KEY }}
          prompt-file: .github/codex/prompts/review.md
          permission-profile: ":read-only"
          output-file: codex-output.md

  post_feedback:
    runs-on: ubuntu-latest
    needs: codex
    if: needs.codex.outputs.final_message != ''
    permissions:
      issues: write
      pull-requests: write
    steps:
      - name: Post Codex feedback
        uses: actions/github-script@v7
        with:
          github-token: ${{ github.token }}
          script: |
            await github.rest.issues.createComment({
              owner: context.repo.owner,
              repo: context.repo.repo,
              issue_number: context.payload.pull_request.number,
              body: process.env.CODEX_FINAL_MESSAGE,
            });
        env:
          CODEX_FINAL_MESSAGE: ${{ needs.codex.outputs.final_message }}
```

For a task that must edit files, replace `:read-only` with the narrowest suitable permission profile and add later steps that inspect, test, or publish the diff.

## Prompt and execution inputs

Action inputs are version-sensitive. Check the `action.yml` for the major version or immutable commit you pin before relying on a newly added input.

| Input | Purpose |
|---|---|
| `prompt` | Inline task instructions |
| `prompt-file` | Repository-relative Markdown/text prompt file; mutually exclusive with `prompt` |
| `codex-args` | Additional `codex exec` flags, as a JSON array or shell string |
| `model` | Model override; omit to use the configured default |
| `effort` | Reasoning-effort override |
| `permission-profile` | Preferred permission control for new workflows; predefined profile or inline JSON |
| `sandbox` | Legacy Codex sandbox input; do not combine with `permission-profile` |
| `output-schema` | Inline JSON Schema for structured output |
| `output-schema-file` | Path to a JSON Schema file; mutually exclusive with `output-schema` |
| `output-file` | Path where the action writes the final Codex message |
| `codex-version` | CLI version to install; pin for reproducibility |
| `codex-home` | Alternate Codex home for shared configuration or MCP setup |
| `working-directory` | Directory from which Codex runs; defaults to the repository workspace |
| `responses-api-endpoint` | Override the Responses API endpoint used by the proxy/client |
| `openai-api-key` | API key used to start the Responses API proxy; normally sourced from a secret |

### `codex-args`

Use a JSON array when quoting matters:

```yaml
with:
  codex-args: '["--ephemeral", "--profile", "ci"]'
```

A shell string is also accepted:

```yaml
with:
  codex-args: --profile ci
```

Prefer direct action inputs for capabilities such as structured output when available; reserve `codex-args` for CLI flags that have no dedicated input.

## Permission profiles and legacy sandboxing

For new workflows, prefer `permission-profile` because it combines filesystem and network policy in one explicit value.

### Predefined profiles

```yaml
with:
  permission-profile: ":read-only"
```

```yaml
with:
  permission-profile: ":workspace"
```

```yaml
with:
  permission-profile: ":dangerously-unrestricted"
```

Use `:read-only` for review and analysis. Use `:workspace` only when Codex must edit the checkout. Treat `:dangerously-unrestricted` as exceptional and require a trusted runner plus trusted inputs.

The legacy input remains useful for older pinned Codex versions:

```yaml
with:
  sandbox: workspace-write
```

Legacy values include `read-only`, `workspace-write`, and `danger-full-access`. `sandbox` and `permission-profile` are mutually exclusive.

## Runner privilege strategy

`safety-strategy` controls operating-system privileges around the action. It is separate from Codex filesystem/network permissions.

| Strategy | Behavior |
|---|---|
| `drop-sudo` | Default on Linux/macOS; removes `sudo` before Codex runs |
| `unprivileged-user` | Runs as `codex-user`; prepare checkout ownership and permissions first |
| `read-only` | Restricts writes/network at the runner layer but retains elevated privilege; do not use it as the only secret defense |
| `unsafe` | Skips hardening; required on Windows and dangerous on shared or untrusted runners |

Example unprivileged configuration:

```yaml
- name: Prepare checkout for Codex user
  run: sudo chown -R codex:codex "$GITHUB_WORKSPACE"

- name: Run Codex
  uses: openai/codex-action@v1
  with:
    openai-api-key: ${{ secrets.OPENAI_API_KEY }}
    prompt-file: .github/codex/prompts/task.md
    safety-strategy: unprivileged-user
    codex-user: codex
    permission-profile: ":workspace"
```

Do ownership or permission preparation before `drop-sudo` or `unprivileged-user` takes effect.

## Trigger authorization

The action performs an authorization check before running.

| Input | Use |
|---|---|
| `allow-users` | Extra trusted GitHub users beyond the default write collaborators |
| `allow-bots` | Permit trusted GitHub Actions bot behavior |
| `allow-bot-users` | Explicit bot/service-account usernames allowed to trigger the action |

Keep these lists narrow. Do not treat trigger authorization as prompt sanitization: an authorized PR can still contain hostile instructions in source files, comments, commit messages, or generated artifacts.

## Outputs and structured data

### Final message

The action exposes the last Codex response as:

```yaml
${{ steps.<step-id>.outputs.final-message }}
```

Map it to a job output when another job needs the response. This keeps comment-posting or publishing credentials out of the Codex job.

`output-file` writes the final response to disk. Upload that file as an artifact if needed; do not assume it contains the complete event transcript.

### JSON Schema output

Use an inline schema:

```yaml
with:
  prompt-file: .github/codex/prompts/review.md
  output-schema: >-
    {
      "type": "object",
      "properties": {
        "summary": { "type": "string" },
        "blocking": { "type": "boolean" },
        "findings": {
          "type": "array",
          "items": { "type": "string" }
        }
      },
      "required": ["summary", "blocking", "findings"],
      "additionalProperties": false
    }
```

Or keep the schema in the repository:

```yaml
with:
  prompt-file: .github/codex/prompts/review.md
  output-schema-file: .github/codex/schemas/review.json
```

Use exactly one of `output-schema` and `output-schema-file`. Treat the resulting `final-message` or `output-file` as JSON and validate it again before using it in privileged automation.

## Security checklist

1. Use trusted events and actors; keep `allow-users`, `allow-bots`, and `allow-bot-users` minimal.
2. Avoid combining `pull_request_target`, untrusted PR checkout, and repository secrets. That pattern can expose secrets to attacker-controlled content.
3. Treat repository text, PR bodies, issue text, commit messages, generated files, and HTML comments as untrusted prompt input.
4. Give `GITHUB_TOKEN` the narrowest job-level `permissions`; keep write permissions in a separate downstream job when possible.
5. Prefer `permission-profile: ":read-only"` for review and `:workspace` only for intentional edits.
6. Keep `safety-strategy: drop-sudo` or use a prepared unprivileged user. Do not use `unsafe` on multi-tenant runners unless the platform requires it and risk is accepted.
7. Set `persist-credentials: false` during checkout when Codex does not need Git credentials.
8. Pin third-party actions and Codex versions according to repository policy; use an immutable action commit when supply-chain policy requires it.
9. Run Codex as the final step in its job so later steps do not inherit unexpected filesystem state. Use a separate job for privileged publication.
10. Rotate the OpenAI key immediately if logs, proxy output, or artifacts may have exposed it.

## Troubleshooting

| Symptom | Check |
|---|---|
| Both `prompt` and `prompt-file` are set | Remove one; exactly one prompt source is allowed |
| Both `output-schema` and `output-schema-file` are set | Remove one |
| Both `permission-profile` and `sandbox` are set | Use one permission mechanism; prefer `permission-profile` for new workflows |
| Responses API proxy did not write server info | Confirm `openai-api-key` is present and valid; the proxy starts only when a key is supplied |
| `sudo` still works unexpectedly | Confirm `safety-strategy`, runner OS, and that no earlier step restored privileges; rerun in a fresh job |
| Permission errors after privilege dropping | Fix checkout ownership/mode before invoking the action, or use the documented unprivileged-user pattern |
| Authorized bot/user is blocked | Review `allow-users`, `allow-bots`, and `allow-bot-users`; distinguish bot behavior from explicit bot usernames |
| Expected edits are missing | Use `:workspace` (or legacy `workspace-write`) and confirm `working-directory` points to the checkout |
| Structured output is not JSON | Verify schema syntax, use a compatible Codex version, and validate the final message before consumption |
| Windows job fails during hardening | Set `safety-strategy: unsafe`, then compensate with a trusted isolated runner and narrow Codex permissions |

## Checklist

1. Choose a trusted workflow event and actor policy.
2. Checkout the exact commit/ref Codex should inspect, with credentials disabled unless required.
3. Provide exactly one prompt source.
4. Select `permission-profile` and runner `safety-strategy` independently.
5. Keep the OpenAI key in GitHub Secrets.
6. Capture `final-message`, `output-file`, or structured JSON intentionally.
7. Put write credentials and publication in a separate downstream job.
8. Validate the workflow YAML and inspect the pinned action's `action.yml` before merging.

## Related

- Codex SDK: `sdk.md`
- Codex app-server: `app-server.md`
- Codex as MCP server: `mcp-server.md`
- Cross-CLI testing: `../shared/testing.md`
