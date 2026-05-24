#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TOKEN_REFRESH_BEFORE_EXPIRY = 3 * 60;
let tokenInfo = { endpoint: null, token: null, expiredAt: null };

function usage() {
  console.log(`Usage:
  node codex/skills/azure-ssml-tts/scripts/generate-speech.mjs \\
    --out static/voice/001.mp3 \\
    --voice zh-CN-XiaoyiNeural \\
    --rate -6% \\
    --text "第一{{phoneme:nan 4|难}}，金蝉遭贬。"

Options:
  --text <text>        Text with optional {{phoneme:PH|TEXT}} markers
  --text-file <path>   Read text from file
  --ssml-file <path>   Use a complete SSML file instead of building one
  --out <path>         Output MP3 path
  --voice <name>       Azure voice name, default zh-CN-XiaoyiNeural
  --rate <value>       Prosody rate, default -6%
  --pitch <value>      Prosody pitch, default +0Hz
  --volume <value>     Prosody volume, default +0%
  --style <value>      mstts express-as style, default general
  --format <value>     Output format, default audio-24khz-48kbitrate-mono-mp3
`);
}

function parseArgs(argv) {
  const args = {
    voice: 'zh-CN-XiaoyiNeural',
    rate: '-6%',
    pitch: '+0Hz',
    volume: '+0%',
    style: 'general',
    format: 'audio-24khz-48kbitrate-mono-mp3',
  };

  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const name = key.slice(2);
    const value = argv[i + 1];
    if (value == null || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    args[name] = value;
    i++;
  }

  if (!args.out) throw new Error('Missing required --out');
  if (!args.text && !args['text-file'] && !args['ssml-file']) {
    throw new Error('Provide --text, --text-file, or --ssml-file');
  }
  return args;
}

function escapeXml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderTextWithPhonemes(text) {
  const marker = /\{\{phoneme:([^|{}]+)\|([^{}]+)\}\}/g;
  let out = '';
  let last = 0;
  let match;
  while ((match = marker.exec(text)) != null) {
    out += escapeXml(text.slice(last, match.index));
    const ph = escapeXml(match[1].trim());
    const label = escapeXml(match[2]);
    out += `<phoneme alphabet="sapi" ph="${ph}">${label}</phoneme>`;
    last = marker.lastIndex;
  }
  out += escapeXml(text.slice(last));
  return out;
}

function buildSsml({ text, voice, rate, pitch, volume, style }) {
  const body = renderTextWithPhonemes(text);
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN">
  <voice name="${escapeXml(voice)}">
    <mstts:express-as style="${escapeXml(style)}" styledegree="2.0" role="default">
      <prosody rate="${escapeXml(rate)}" pitch="${escapeXml(pitch)}" volume="${escapeXml(volume)}">${body}</prosody>
    </mstts:express-as>
  </voice>
</speak>`;
}

function uuid() {
  return crypto.randomUUID().replace(/-/g, '');
}

function dateFormat() {
  return new Date().toUTCString().replace(/GMT/, '').trim().toLowerCase() + ' GMT';
}

function base64ToBytes(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode.apply(null, bytes));
}

async function hmacSha256(key, data) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    key,
    { name: 'HMAC', hash: { name: 'SHA-256' } },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
  return new Uint8Array(signature);
}

async function sign(urlStr) {
  const url = urlStr.split('://')[1];
  const encodedUrl = encodeURIComponent(url);
  const uuidStr = uuid();
  const formattedDate = dateFormat();
  const bytesToSign = `MSTranslatorAndroidApp${encodedUrl}${formattedDate}${uuidStr}`.toLowerCase();
  const signingSeed = base64ToBytes('oik6PdDdMnOXemTbwvMn9de/h9lFnfBaCWbGMMZqqoSaQaqUOqjVGm5NqsmjcBI1x+sS9ugjB55HEJWRiFXYFw==');
  const signData = await hmacSha256(signingSeed, bytesToSign);
  const signBase64 = bytesToBase64(signData);
  return `MSTranslatorAndroidApp::${signBase64}::${formattedDate}::${uuidStr}`;
}

async function getEndpoint() {
  const now = Date.now() / 1000;
  if (tokenInfo.token && tokenInfo.expiredAt && now < tokenInfo.expiredAt - TOKEN_REFRESH_BEFORE_EXPIRY) {
    return tokenInfo.endpoint;
  }

  const endpointUrl = 'https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0';
  const clientId = uuid();
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Accept-Language': 'zh-Hans',
      'X-ClientVersion': '4.0.530a 5fe1dc6c',
      'X-UserId': '0f04d16a175c411e',
      'X-HomeGeographicRegion': 'zh-Hans-CN',
      'X-ClientTraceId': clientId,
      'X-MT-Signature': await sign(endpointUrl),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': '0',
      'Accept-Encoding': 'gzip',
    },
  });
  if (!response.ok) throw new Error(`Endpoint request failed: ${response.status} ${await response.text()}`);

  const data = await response.json();
  const jwt = data.t.split('.')[1];
  const decodedJwt = JSON.parse(atob(jwt));
  tokenInfo = { endpoint: data, token: data.t, expiredAt: decodedJwt.exp };
  return data;
}

async function synthesize(ssml, outFile, outputFormat) {
  const endpoint = await getEndpoint();
  const url = `https://${endpoint.r}.tts.speech.microsoft.com/cognitiveservices/v1`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: endpoint.t,
      'Content-Type': 'application/ssml+xml',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
      'X-Microsoft-OutputFormat': outputFormat,
    },
    body: ssml,
  });
  if (!response.ok) throw new Error(`TTS request failed: ${response.status} ${await response.text()}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, bytes);
  console.log(`Wrote ${outFile} (${bytes.length} bytes)`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  let ssml;
  if (args['ssml-file']) {
    ssml = fs.readFileSync(args['ssml-file'], 'utf8');
  } else {
    const text = args['text-file'] ? fs.readFileSync(args['text-file'], 'utf8') : args.text;
    ssml = buildSsml({
      text,
      voice: args.voice,
      rate: args.rate,
      pitch: args.pitch,
      volume: args.volume,
      style: args.style,
    });
  }
  await synthesize(ssml, args.out, args.format);
}

main().catch((error) => {
  console.error(error.message || error);
  usage();
  process.exit(1);
});
