---
name: azure-ssml-tts
description: Generate Chinese MP3 narration with Azure Speech REST SSML, especially when Edge-TTS misreads Chinese polyphonic characters such as 难. Use this for Journey to the West trial audio, SSML phoneme tags, and static/voice/*.mp3 generation.
---

# Azure SSML TTS

Use this skill when generating app narration audio that needs reliable Chinese polyphonic-character control.

Do not use the `edge-tts` Python package for SSML phoneme work. In this project it treats raw SSML as text or rejects `<phoneme>`. Use the bundled REST script instead.

## Workflow

1. Prepare narration text.
2. Mark forced pronunciations inline:

```text
第一{{phoneme:nan 4|难}}，金蝉遭贬。
```

3. Run the script:

```bash
node codex/skills/azure-ssml-tts/scripts/generate-speech.mjs \
  --out static/voice/001.mp3 \
  --voice zh-CN-XiaoyiNeural \
  --rate -6% \
  --text "第一{{phoneme:nan 4|难}}，金蝉遭贬。"
```

4. Verify output:

```bash
file static/voice/001.mp3
ls -lh static/voice/001.mp3
```

5. If the app caches audio, update `audioCacheVersion` in `pages/detail/detail.uvue`.

## Recommended Voices

- `zh-CN-XiaoyiNeural`: sweet female, good for child-friendly story narration.
- `zh-CN-XiaoxiaoNeural`: warm female, general purpose.
- `zh-CN-XiaohanNeural`: calmer female style, if available through the endpoint.
- `zh-CN-YunxiNeural`: clear male voice.

## Notes

- The script writes MP3 by default using `audio-24khz-48kbitrate-mono-mp3`.
- It fetches an endpoint token at runtime and does not persist access tokens.
- Keep generated app audio under `static/voice/NNN.mp3`.
- For Journey to the West trial titles, prefer explicit phoneme markers over semantic substitutions.
