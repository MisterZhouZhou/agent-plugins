#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const TOKEN_REFRESH_BEFORE_EXPIRY = 3 * 60;
let tokenInfo = { endpoint: null, token: null, expiredAt: null };

function parseArgs(argv) {
  const args = {
    from: 1,
    to: 81,
    outDir: 'static/voice',
    voice: 'zh-CN-XiaoyiNeural',
    rate: '-6%',
    pitch: '+0Hz',
    volume: '+0%',
    style: 'general',
    format: 'audio-24khz-48kbitrate-mono-mp3',
    data: 'common/westjourney.uts',
    details: 'common/trial-details.uts',
    overwrite: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (!key.startsWith('--')) throw new Error(`Unexpected argument: ${key}`);
    const name = key.slice(2);
    if (name === 'overwrite') {
      args.overwrite = true;
      continue;
    }
    const value = argv[i + 1];
    if (value == null || value.startsWith('--')) throw new Error(`Missing value for ${key}`);
    if (name === 'from' || name === 'to') {
      args[name] = Number(value);
    } else {
      args[name] = value;
    }
    i++;
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
    out += `<phoneme alphabet="sapi" ph="${escapeXml(match[1].trim())}">${escapeXml(match[2])}</phoneme>`;
    last = marker.lastIndex;
  }
  out += escapeXml(text.slice(last));
  return out;
}

function buildSsml({ text, voice, rate, pitch, volume, style }) {
  return `<speak xmlns="http://www.w3.org/2001/10/synthesis" xmlns:mstts="http://www.w3.org/2001/mstts" version="1.0" xml:lang="zh-CN">
  <voice name="${escapeXml(voice)}">
    <mstts:express-as style="${escapeXml(style)}" styledegree="2.0" role="default">
      <prosody rate="${escapeXml(rate)}" pitch="${escapeXml(pitch)}" volume="${escapeXml(volume)}">${renderTextWithPhonemes(text)}</prosody>
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
  const cryptoKey = await crypto.subtle.importKey('raw', key, { name: 'HMAC', hash: { name: 'SHA-256' } }, false, ['sign']);
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
  return `MSTranslatorAndroidApp::${bytesToBase64(signData)}::${formattedDate}::${uuidStr}`;
}

async function getEndpoint() {
  const now = Date.now() / 1000;
  if (tokenInfo.token && tokenInfo.expiredAt && now < tokenInfo.expiredAt - TOKEN_REFRESH_BEFORE_EXPIRY) return tokenInfo.endpoint;

  const endpointUrl = 'https://dev.microsofttranslator.com/apps/endpoint?api-version=1.0';
  const response = await fetch(endpointUrl, {
    method: 'POST',
    headers: {
      'Accept-Language': 'zh-Hans',
      'X-ClientVersion': '4.0.530a 5fe1dc6c',
      'X-UserId': '0f04d16a175c411e',
      'X-HomeGeographicRegion': 'zh-Hans-CN',
      'X-ClientTraceId': uuid(),
      'X-MT-Signature': await sign(endpointUrl),
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36 Edg/127.0.0.0',
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': '0',
      'Accept-Encoding': 'gzip',
    },
  });
  if (!response.ok) throw new Error(`Endpoint request failed: ${response.status} ${await response.text()}`);
  const data = await response.json();
  const decodedJwt = JSON.parse(atob(data.t.split('.')[1]));
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
  return bytes.length;
}

function parseTitleList(source) {
  const match = source.match(/const titleList = \[([\s\S]*?)\]/);
  if (!match) throw new Error('Could not find titleList');
  const titles = [];
  const itemRegex = /'([^']+)'/g;
  let item;
  while ((item = itemRegex.exec(match[1])) != null) titles.push(item[1]);
  if (titles.length !== 81) throw new Error(`Expected 81 titles, found ${titles.length}`);
  return titles;
}

function getOverride(source, index, prop) {
  const regex = new RegExp(`trials\\[${index}\\]\\.${prop}\\s*=\\s*'([^']*)'`);
  const match = source.match(regex);
  return match ? match[1] : '';
}

function unquote(value) {
  return value.replace(/\\'/g, "'").replace(/\\\\/g, '\\');
}

function getObjectField(block, prop) {
  const regex = new RegExp(`${prop}:\\s*'((?:\\\\'|\\\\\\\\|[^'])*)'`);
  const match = block.match(regex);
  return match ? unquote(match[1]) : '';
}

function parseTrialDetails(source) {
  const trials = [];
  const blockRegex = /\{\s*id:\s*(\d+),[\s\S]*?treasures:\s*\[[\s\S]*?\]\s*\}/g;
  let block;
  while ((block = blockRegex.exec(source)) != null) {
    trials.push({
      id: Number(block[1]),
      title: getObjectField(block[0], 'title'),
      content: getObjectField(block[0], 'content'),
    });
  }
  trials.sort((a, b) => a.id - b.id);
  if (trials.length !== 81) throw new Error(`Expected 81 trial details, found ${trials.length}`);
  return trials;
}

function chineseNumber(id) {
  const nums = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  if (id < 10) return nums[id];
  if (id === 10) return '十';
  if (id < 20) return `十${nums[id - 10]}`;
  const ten = Math.floor(id / 10);
  const one = id % 10;
  if (one === 0) return `${nums[ten]}十`;
  return `${nums[ten]}十${nums[one]}`;
}

function pad3(id) {
  return String(id).padStart(3, '0');
}

function trialText({ id, title, content }) {
  const number = chineseNumber(id);
  const safeContent = content || `${title}一{{phoneme:nan 4|难}}剧情已接入，师徒继续西行，经历险阻后化解危机。`;
  return `第${number}{{phoneme:nan 4|难}}，${title}。${markNanInOrdinalText(safeContent)}`;
}

function markNanInOrdinalText(text) {
  return text
    .replace(/第([一二三四五六七八九十百零两]+)难/g, '第$1{{phoneme:nan 4|难}}')
    .replace(/九九八十一难/g, '九九八十一{{phoneme:nan 4|难}}')
    .replace(/八十一难/g, '八十一{{phoneme:nan 4|难}}')
    .replace(/一难/g, '一{{phoneme:nan 4|难}}');
}

function loadTrials(dataPath) {
  const args = parseArgs(process.argv.slice(2));
  if (args.details && fs.existsSync(args.details)) {
    return parseTrialDetails(fs.readFileSync(args.details, 'utf8'));
  }
  const source = fs.readFileSync(dataPath, 'utf8');
  const titles = parseTitleList(source);
  return titles.map((title, index) => {
    const id = index + 1;
    const overrideContent = getOverride(source, index, 'content');
    const defaultContent = `${title}一{{phoneme:nan 4|难}}中，唐僧师徒继续西行，因妖魔、地势或人事因缘遭遇阻碍。众人查明缘由，合力化解危机，守住取经初心，继续向灵山前进。`;
    return { id, title, content: overrideContent || defaultContent };
  });
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const trials = loadTrials(args.data).filter((trial) => trial.id >= args.from && trial.id <= args.to);
  fs.mkdirSync(args.outDir, { recursive: true });

  for (const trial of trials) {
    const outFile = path.join(args.outDir, `${pad3(trial.id)}.mp3`);
    if (!args.overwrite && fs.existsSync(outFile) && fs.statSync(outFile).size > 0) {
      console.log(`skip ${pad3(trial.id)} ${trial.title}`);
      continue;
    }
    const text = trialText(trial);
    const ssml = buildSsml({ text, voice: args.voice, rate: args.rate, pitch: args.pitch, volume: args.volume, style: args.style });
    const size = await synthesize(ssml, outFile, args.format);
    console.log(`wrote ${pad3(trial.id)} ${trial.title} (${size} bytes)`);
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
