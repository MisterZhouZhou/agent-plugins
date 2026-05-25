---
name: api-generate-image
description: Generate images through an OpenAI-compatible Image API (default gpt-image-2). Supports OPENAI_API_KEY + optional CUSTOM_IMAGE_URL for custom endpoints; falls back to official OpenAI API when no custom URL is set. Use when the user asks to generate images via API/CLI, /v1/images/generations, or wants to specify a custom image model or endpoint.
---

# API Generate Image

Use this skill to generate raster images through an OpenAI-compatible Image API. Defaults to `gpt-image-2` via the official OpenAI API; supports any compatible endpoint via `CUSTOM_IMAGE_URL`.

## Rules

- Resolve credentials in this order: environment variables first, then `~/.codex/api-generate-image/config.json`, then interactive `--configure` prompts when a terminal is available.
- `OPENAI_API_KEY` is always required. `CUSTOM_IMAGE_URL` / `OPENAI_BASE_URL` are optional — when both are absent the script calls the official OpenAI API (`https://api.openai.com/v1`).
- Never echo, commit, or write API keys anywhere except the user-local config file after explicit confirmation.
- Prefer `scripts/generate_image.py` instead of hand-writing one-off API callers.
- If `CUSTOM_IMAGE_URL` is set to a path such as `https://host/api/image/generate`, normalize the same origin to `https://host/v1` and call `/v1/images/generations`.
- Default model is `gpt-image-2`; pass `--model` to override (e.g. `dall-e-3`).
- Keep the user's prompt verbatim unless they ask for prompt polishing.

## Credentials & endpoint

| Variable | Required | Purpose |
|---|---|---|
| `OPENAI_API_KEY` | Yes | API authentication key |
| `CUSTOM_IMAGE_URL` | No | Full URL of a custom image endpoint; script derives `/v1` base from it |
| `OPENAI_BASE_URL` | No | Explicit OpenAI-compatible base URL (takes precedence over `CUSTOM_IMAGE_URL`) |

When neither `CUSTOM_IMAGE_URL` nor `OPENAI_BASE_URL` is set, the script defaults to the official OpenAI API.

## config.json format

Credentials can be stored in `~/.codex/api-generate-image/config.json` (file is created by `--configure` or written manually). Example:

```json
{
  "OPENAI_API_KEY": "sk-...",
  "CUSTOM_IMAGE_URL": "https://your-proxy.example.com/api/image/generate"
}
```

For the official OpenAI API (no custom endpoint):

```json
{
  "OPENAI_API_KEY": "sk-..."
}
```

Environment variables always override this file. Do not commit the config file.

## One-time configuration

```bash
python skills/api-generate-image/scripts/generate_image.py --configure
```

The script prompts for missing values, hides API-key input, and persists them to `~/.codex/api-generate-image/config.json` after confirmation.

## Quick start

```bash
# Official OpenAI API, default model gpt-image-2
OPENAI_API_KEY=sk-... python skills/api-generate-image/scripts/generate_image.py \
  --prompt "A sunset over the ocean" \
  --out output/imagegen/sunset.png \
  --force

# Custom endpoint + custom model
OPENAI_API_KEY=sk-... CUSTOM_IMAGE_URL=https://my-proxy.example.com/v1/images/generations \
  python skills/api-generate-image/scripts/generate_image.py \
  --prompt "A sunset over the ocean" \
  --model dall-e-3 \
  --out output/imagegen/sunset.png \
  --force
```

## Workflow

1. Run `scripts/generate_image.py --dry-run` for a cheap configuration check.
2. If credentials are missing and an interactive terminal is available, run `scripts/generate_image.py --configure`.
3. Save long prompts to a temporary file to avoid shell quoting issues; pass with `--prompt-file`.
4. Run with `--prompt` or `--prompt-file`; output defaults to `output/imagegen/output.png`.
5. Validate the saved file: existence, non-zero byte size, and dimensions.

## Validation snippets

Python dimension check:

```python
from PIL import Image
img = Image.open("output/imagegen/result.png")
print(img.size)  # (width, height)
```

PowerShell dimension check:

```powershell
Add-Type -AssemblyName System.Drawing
$path = 'output/imagegen/result.png'
$item = Get-Item -LiteralPath $path
$img = [System.Drawing.Image]::FromFile((Resolve-Path $path).Path)
try {
  [pscustomobject]@{
    Path = $path
    Bytes = $item.Length
    Dimensions = "$($img.Width)x$($img.Height)"
  } | ConvertTo-Json -Compress
} finally {
  $img.Dispose()
}
```

## Troubleshooting

- `404 page not found` on `/api/image/generate`: use the same host's `/v1/images/generations` route by setting `OPENAI_BASE_URL=https://host/v1`.
- Missing credentials in a non-interactive run: set environment variables or run `--configure` in a terminal.
- `openai SDK is not installed`: run `python -m pip install openai`.
- Existing output path: pass `--force` or choose a new filename.
