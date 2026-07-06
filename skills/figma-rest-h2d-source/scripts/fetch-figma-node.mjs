#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const value = argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[++i] : true;
    args[key] = value;
  }
  return args;
}

function usage() {
  console.error(`Usage:
  FIGMA_TOKEN=figd_... node scripts/fetch-figma-node.mjs --file-key <key> --node-id <id> [--component <Name> | --out <path>]
  FIGMA_TOKEN=figd_... node scripts/fetch-figma-node.mjs --url <figma-url> [--component <Name> | --out <path>]

Options:
  --url         Full Figma URL containing /design/<fileKey>/ and node-id=<id>
  --file-key    Figma file key, for example Zvry3oKVDBJrnCXL1oYPWX
  --node-id     Figma node id, for example 16170:46288 or 16170-46288
  --component   Component output folder under output/
  --out         Explicit output JSON path
  --dry-run     Print resolved parameters without sending a request
`);
}

function normalizeNodeId(value) {
  return String(value || "").trim().replace(/^(\d+)-(\d+)$/, "$1:$2");
}

function parseFigmaUrl(rawUrl) {
  if (!rawUrl) return {};

  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid Figma URL: ${rawUrl}`);
  }

  const parts = parsed.pathname.split("/").filter(Boolean);
  const designIndex = parts.findIndex((part) => part === "design" || part === "file");
  const fileKey = designIndex >= 0 ? parts[designIndex + 1] : undefined;
  const branchIndex = parts.findIndex((part) => part === "branch");
  const branchKey = branchIndex >= 0 ? parts[branchIndex + 1] : undefined;
  const nodeId = normalizeNodeId(parsed.searchParams.get("node-id"));

  return {
    fileKey: branchKey || fileKey,
    nodeId,
  };
}

const args = parseArgs(process.argv.slice(2));
const fromUrl = parseFigmaUrl(args.url);
const fileKey = args["file-key"] || fromUrl.fileKey;
const nodeId = normalizeNodeId(args["node-id"] || fromUrl.nodeId);
const token = process.env.FIGMA_TOKEN || process.env.FIGMA_REST_TOKEN;

if (!fileKey || !nodeId || (!token && !args["dry-run"])) {
  usage();
  process.exit(1);
}

const safeNodeId = nodeId.replace(/[^0-9A-Za-z_-]+/g, "-");
const outPath = args.out
  ? path.resolve(args.out)
  : path.resolve("output", args.component || "FigmaREST", `figma-rest-node-${safeNodeId}.json`);

if (args["dry-run"]) {
  console.log(`fileKey: ${fileKey}`);
  console.log(`nodeId: ${nodeId}`);
  console.log(`out: ${outPath}`);
  process.exit(0);
}

const url = `https://api.figma.com/v1/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeId)}`;

const response = await fetch(url, {
  headers: {
    "X-Figma-Token": token,
  },
});

const body = await response.text();
if (!response.ok) {
  let message = body.slice(0, 500);
  try {
    const parsed = JSON.parse(body);
    message = parsed.err || parsed.message || message;
  } catch {
    // Keep raw message.
  }
  console.error(`Figma REST request failed: HTTP ${response.status} ${message}`);
  process.exit(1);
}

const json = JSON.parse(body);
const node = json.nodes?.[nodeId]?.document;
if (!node) {
  console.error(`Figma REST response did not include node ${nodeId}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, `${JSON.stringify(json, null, 2)}\n`);

const box = node.absoluteBoundingBox || node.absoluteRenderBounds || {};
console.log(`saved: ${outPath}`);
console.log(`node: ${node.name || "unknown"} (${node.type || "unknown"})`);
if (box.width && box.height) {
  console.log(`size: ${box.width}x${box.height}`);
}
console.log(`bytes: ${fs.statSync(outPath).size}`);
