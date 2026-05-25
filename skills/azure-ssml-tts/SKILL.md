---
name: azure-ssml-tts
description: Generate MP3 narration with Azure Speech REST SSML. Supports Chinese, English, Japanese, Korean, French, German, Spanish, and Russian voices. Use for reliable Chinese polyphonic-character control (e.g. 难/乐/重), SSML phoneme tags, inline markup for pause/emphasis/rate/pitch/volume/style, and any TTS audio generation task.
---

# Azure SSML TTS

Use this skill when generating app narration audio, especially when polyphonic Chinese characters need forced pronunciation, or when fine-grained control over pause, emphasis, speed, pitch, volume, or speaking style is required.

Do not use the `edge-tts` Python package for SSML phoneme work — it treats raw SSML as text or rejects `<phoneme>`. Use the bundled REST script instead.

## Workflow

1. Prepare narration text with optional inline markup (see below).
2. Mark forced pronunciations if needed:

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

---

## Quick-Pick Voices

### Chinese 中文

| Voice ID | 描述 |
|---|---|
| `zh-CN-XiaoxiaoNeural` | 晓晓 — 女声·温柔，通用首选 |
| `zh-CN-XiaoyiNeural` | 晓伊 — 女声·甜美，适合儿童故事 |
| `zh-CN-XiaohanNeural` | 晓涵 — 女声·优雅，平静朗读 |
| `zh-CN-XiaoruiNeural` | 晓睿 — 女声·智慧，知识类内容 |
| `zh-CN-YunxiNeural` | 云希 — 男声·清朗，通用 |
| `zh-CN-YunyangNeural` | 云扬 — 男声·阳光，活力内容 |
| `zh-CN-YunjianNeural` | 云健 — 男声·稳重，正式场合 |
| `zh-CN-YunzeNeural` | 云泽 — 男声·深沉，磁性旁白 |

完整中文音色列表：`zh-CN-XiaochenNeural` / `zh-CN-XiaomengNeural` / `zh-CN-XiaomoNeural` / `zh-CN-XiaoqiuNeural` / `zh-CN-XiaoshuangNeural` / `zh-CN-XiaoxuanNeural` / `zh-CN-XiaoyanNeural` / `zh-CN-XiaoyouNeural` / `zh-CN-XiaozhenNeural` / `zh-CN-YunfengNeural` / `zh-CN-YunhaoNeural` / `zh-CN-YunxiaNeural` / `zh-CN-YunyeNeural`

### English

| Voice ID | Description |
|---|---|
| `en-US-JennyNeural` | Female, US — general purpose |
| `en-US-AriaNeural` | Female, US — expressive |
| `en-US-GuyNeural` | Male, US — general purpose |
| `en-US-DavisNeural` | Male, US — casual |
| `en-GB-SoniaNeural` | Female, UK |
| `en-GB-RyanNeural` | Male, UK |
| `en-AU-NatashaNeural` | Female, AU |
| `en-AU-WilliamNeural` | Male, AU |

More US voices: `en-US-AmberNeural` / `en-US-AnaNeural`(child) / `en-US-AndrewNeural` / `en-US-AshleyNeural` / `en-US-BrandonNeural` / `en-US-ChristopherNeural` / `en-US-CoraNeural` / `en-US-ElizabethNeural` / `en-US-EricNeural` / `en-US-JacobNeural` / `en-US-JaneNeural` / `en-US-JasonNeural` / `en-US-MichelleNeural` / `en-US-MonicaNeural` / `en-US-NancyNeural` / `en-US-RogerNeural` / `en-US-SaraNeural` / `en-US-SteffanNeural` / `en-US-TonyNeural`  
More UK voices: `en-GB-LibbyNeural` / `en-GB-MaisieNeural`(child)

### Japanese 日本語

`ja-JP-NanamiNeural`(女) / `ja-JP-KeitaNeural`(男) / `ja-JP-AoiNeural`(女) / `ja-JP-DaichiNeural`(男) / `ja-JP-MayuNeural`(女) / `ja-JP-NaokiNeural`(男) / `ja-JP-ShioriNeural`(女)

### Korean 한국어

`ko-KR-SunHiNeural`(여) / `ko-KR-InJoonNeural`(남) / `ko-KR-BongJinNeural`(남) / `ko-KR-GookMinNeural`(남) / `ko-KR-JiMinNeural`(여) / `ko-KR-SeoHyeonNeural`(여) / `ko-KR-SoonBokNeural`(여) / `ko-KR-YuJinNeural`(여)

### French / German / Spanish / Russian

**French:** `fr-FR-DeniseNeural`(F) / `fr-FR-HenriNeural`(M) / `fr-FR-EloiseNeural`(F) / `fr-FR-AlainNeural`(M) / `fr-FR-BrigitteNeural` / `fr-FR-CelesteNeural` / `fr-FR-ClaudeNeural` / `fr-FR-CoraliNeural` / `fr-FR-JacquelineNeural` / `fr-FR-JeromeNeural` / `fr-FR-JosephineNeural` / `fr-FR-MauriceNeural` / `fr-FR-YvesNeural` / `fr-FR-YvetteNeural`

**German:** `de-DE-KatjaNeural`(F) / `de-DE-ConradNeural`(M) / `de-DE-AmalaNeural` / `de-DE-BerndNeural` / `de-DE-ChristophNeural` / `de-DE-ElkeNeural` / `de-DE-GiselaNeural` / `de-DE-KasperNeural` / `de-DE-KillianNeural` / `de-DE-KlarissaNeural` / `de-DE-KlausNeural` / `de-DE-LouisaNeural` / `de-DE-MajaNeural` / `de-DE-RalfNeural` / `de-DE-TanjaNeural`

**Spanish:** `es-ES-ElviraNeural`(F) / `es-ES-AlvaroNeural`(M) / `es-ES-AbrilNeural` / `es-ES-ArnauNeural` / `es-ES-DarioNeural` / `es-ES-EliasNeural` / `es-ES-EstrellaNeural` / `es-ES-IreneNeural` / `es-ES-LaiaNeural` / `es-ES-LiaNeural` / `es-ES-NilNeural` / `es-ES-SaulNeural` / `es-ES-TeoNeural` / `es-ES-TrianaNeural` / `es-ES-VeraNeural` / `es-MX-DaliaNeural`(MX,F) / `es-MX-JorgeNeural`(MX,M)

**Russian:** `ru-RU-SvetlanaNeural`(Ж) / `ru-RU-DmitryNeural`(М) / `ru-RU-DariyaNeural`(Ж)

---

## Styles（情感风格，仅中文音色）

在 `--text` 中使用 `[style:xxx]` 标记，或通过脚本 `--style` 参数指定全局风格。

| Style | 说明 |
|---|---|
| `general` | 通用风格（默认） |
| `assistant` | 智能助手 |
| `chat` | 聊天对话，轻松随意 |
| `customerservice` | 客服专业，礼貌清晰 |
| `newscast` | 新闻播报，正式权威 |
| `affectionate` | 亲切温暖 |
| `calm` | 平静舒缓 |
| `cheerful` | 愉快欢乐 |
| `gentle` | 温和柔美 |
| `lyrical` | 抒情诗意 |
| `serious` | 严肃正式 |

> 风格支持因音色而异；`zh-CN-XiaoxiaoNeural` 和 `zh-CN-YunxiNeural` 支持最多风格。

---

## Inline Markup（行内标记语法）

在文本中插入标记可精确控制停顿、重音、语速、音调、音量、情感和朗读方式。语法：`[名字:值]内容[/名字]`，pause 自闭合。

### ⏸ 停顿 pause（自闭合）

```
[pause:500ms]        精确毫秒，最大 5000ms
[pause:1.5s]         秒，支持小数
[pause:weak]         按强度：x-weak / weak / medium / strong / x-strong
[pause:medium]
[pause:strong]
[pause]              默认中等停顿
```

### 💪 重音 emphasis

```
[emphasis:strong]非常重要[/emphasis]
```
级别：`reduced` / `moderate` / `strong` / `x-strong`

### 🎚 语速 / 音调 / 音量

```
[rate:slow]慢速朗读[/rate]         x-slow / slow / medium / fast / x-fast 或 ±N%（如 +50%）
[pitch:+10%]音调偏高[/pitch]       high / low 或 ±NHz / ±N% / ±Nst（半音）
[volume:loud]音量加大[/volume]     silent / soft / loud / x-loud 或 ±NdB
```

### 🎭 情感风格 style（中文音色）

```
[style:cheerful]开心地说[/style]
[style:cheerful:1.5]更开心[/style]    强度 0.01 ~ 2.0，默认 1.0
```

### 🔢 朗读方式 say-as

```
[say-as:digits]12345[/say-as]              逐字读数字
[say-as:telephone]13800138000[/say-as]     电话号码格式
[say-as:date]2026-05-24[/say-as]           日期
[say-as:characters]ABC[/say-as]            逐字母读
```

### 🔁 别名替换 sub

```
[sub:北京]bj[/sub]    把 "bj" 读作 "北京"
```

### 综合示例

```
大家好[pause:500ms][emphasis:strong]欢迎使用[/emphasis][pause:300ms][rate:slow]今天我要慢慢介绍[/rate]电话[say-as:telephone]13800138000[/say-as]
```

```
[style:cheerful:1.2]今天天气真好！[/style][pause:1s][rate:-20%]接下来，我们慢慢聊。[/rate]
```

### 限制

- 单次停顿最长 **5 秒**
- 整段总停顿 **≤ 30 秒**
- 全部标记上限 **50 个**
- 值不合法或未闭合时，标记原样保留为文本（不报错）

---

## Notes

- The script writes MP3 by default using `audio-24khz-48kbitrate-mono-mp3`.
- It fetches an endpoint token at runtime and does not persist access tokens.
- Keep generated app audio under `static/voice/NNN.mp3`.
- For Journey to the West trial titles, prefer explicit phoneme markers over semantic substitutions.
- For more complex needs (phoneme, lang, audio embed, custom lexicon), use raw SSML mode.
