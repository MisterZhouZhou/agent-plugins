#!/usr/bin/env node

import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { readFileSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { isKebabCase, parseArgs, renderTemplate, walkFiles } from './lib.mjs'

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const assetsDirectory = resolve(scriptDirectory, '../assets')
const templateDirectory = join(assetsDirectory, 'standalone-template')
const packageTemplate = readFileSync(join(templateDirectory, 'package.json.tmpl'), 'utf8')
const kinds = new Set(['host', 'client', 'fullstack'])
const capabilities = new Set(['plugin', 'tool'])
const defaultVersions = {
  cordisVersion: '^4.0.2',
  sdkVersion: '^0.1.2-alpha.4',
  schemasteryVersion: '^3.18.2',
  toolsVersion: '^0.0.1-rc.1',
}

const argumentSchema = {
  name: true,
  directory: true,
  kind: true,
  capability: true,
  'package-name': true,
  'dsh-range': true,
  'cordis-version': true,
  'sdk-version': true,
  'schemastery-version': true,
  'tools-version': true,
}

function printHelp() {
  console.log(`用法：node scaffold.mjs --name <kebab-name> --directory <path> --kind <host|client|fullstack> --package-name <npm-package> --dsh-range <semver-range> [--capability <plugin|tool>] [--cordis-version <version>] [--sdk-version <version>] [--schemastery-version <version>] [--tools-version <version>]

从独立模板生成 DSH 插件项目。

参数：
  --name                 插件标识，必须是 kebab-case
  --directory            生成目标目录；目标目录不存在时会创建，非空目录会拒绝
  --kind                 插件形态：host、client 或 fullstack
  --capability           Host 能力模板：plugin 或 tool；默认 plugin
  --package-name         npm 包名，不能为空
  --dsh-range            兼容的 DSH 版本范围，不能为空
  --cordis-version       Cordis 版本；默认 ${defaultVersions.cordisVersion}
  --sdk-version          官方 Client SDK 版本；默认 ${defaultVersions.sdkVersion}
  --schemastery-version  Schemastery 版本；默认 ${defaultVersions.schemasteryVersion}
  --tools-version        dsh-tools 版本；Tool 模板默认 ${defaultVersions.toolsVersion}
  --help                 显示帮助

默认版本是 2026-09-03 调研基线，不代表永久的最新版；请按目标宿主覆盖并重新确认兼容性。
`)
}

function requiredString(value, optionName) {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new TypeError(`参数 --${optionName} 不能为空`)
  }
  return value.trim()
}

function optionalVersion(parsed, key, fallback) {
  return parsed[key] === undefined ? fallback : requiredString(parsed[key], key)
}

function toPascalCase(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

function templateVariables(variables) {
  return {
    DSH_RANGE: variables.dshRange,
    CORDIS_VERSION: variables.cordisVersion,
    SDK_VERSION: variables.sdkVersion,
    SCHEMASTERY_VERSION: variables.schemasteryVersion,
    TOOLS_VERSION: variables.toolsVersion,
    PACKAGE_NAME: variables.packageName,
    PLUGIN_NAME: variables.name,
    PLUGIN_ID: variables.name,
    DESCRIPTION: `${variables.packageName} DSH plugin`,
    CAPABILITY: variables.capability,
    PLUGIN_PASCAL: toPascalCase(variables.name),
  }
}

/**
 * 从模板 manifest 创建形态和能力相关的 package.json。
 *
 * 先解析完整模板，再按 host/client/fullstack 与 capability 修改字段，避免在
 * JSON 模板中使用容易失配的条件占位符。
 */
export function createManifest({
  name,
  packageName,
  kind,
  capability = 'plugin',
  dshRange,
  cordisVersion = defaultVersions.cordisVersion,
  sdkVersion = defaultVersions.sdkVersion,
  schemasteryVersion = defaultVersions.schemasteryVersion,
  toolsVersion = defaultVersions.toolsVersion,
}) {
  const variables = {
    name,
    packageName,
    kind,
    capability,
    dshRange,
    cordisVersion,
    sdkVersion,
    schemasteryVersion,
    toolsVersion,
  }
  const manifest = JSON.parse(renderTemplate(packageTemplate, templateVariables(variables)))

  manifest.name = packageName
  delete manifest.private

  if (kind === 'host') {
    delete manifest.exports['./client']
    delete manifest.dsh.client
    delete manifest.devDependencies['@deepseek-ai/dsh-client-connection']
  }

  if (capability === 'tool') {
    manifest.dependencies['@deepseek-ai/dsh-tools'] = toolsVersion
  }

  return manifest
}

function parseOptions(argv) {
  const parsed = parseArgs(argv, argumentSchema)
  if (parsed.help) return parsed

  const name = requiredString(parsed.name, 'name')
  const directory = requiredString(parsed.directory, 'directory')
  const kind = requiredString(parsed.kind, 'kind')
  const capability = parsed.capability === undefined
    ? 'plugin'
    : requiredString(parsed.capability, 'capability')
  const packageName = requiredString(parsed['package-name'], 'package-name')
  const dshRange = requiredString(parsed['dsh-range'], 'dsh-range')
  const cordisVersion = optionalVersion(parsed, 'cordis-version', defaultVersions.cordisVersion)
  const sdkVersion = optionalVersion(parsed, 'sdk-version', defaultVersions.sdkVersion)
  const schemasteryVersion = optionalVersion(parsed, 'schemastery-version', defaultVersions.schemasteryVersion)
  const toolsVersion = optionalVersion(parsed, 'tools-version', defaultVersions.toolsVersion)

  if (!isKebabCase(name)) {
    throw new TypeError(`参数 --name 必须是 kebab-case：${name}`)
  }
  if (!kinds.has(kind)) {
    throw new TypeError(`参数 --kind 必须是 host、client 或 fullstack：${kind}`)
  }
  if (!capabilities.has(capability)) {
    throw new TypeError(`参数 --capability 必须是 plugin 或 tool：${capability}`)
  }
  if (kind === 'client' && capability === 'tool') {
    throw new TypeError('Tool capability 需要 Host 运行时，不能与 client-only 形态组合')
  }

  return {
    name,
    directory,
    kind,
    capability,
    packageName,
    dshRange,
    cordisVersion,
    sdkVersion,
    schemasteryVersion,
    toolsVersion,
  }
}

async function ensureTargetAvailable(targetDirectory) {
  try {
    const targetStat = await stat(targetDirectory)
    if (!targetStat.isDirectory()) {
      throw new Error(`生成目标不是目录，拒绝覆盖：${targetDirectory}`)
    }
    if ((await readdir(targetDirectory)).length > 0) {
      throw new Error(`生成目标不是空目录，拒绝覆盖：${targetDirectory}`)
    }
  } catch (error) {
    if (error?.code === 'ENOENT') return
    throw error
  }
}

async function removeKindFiles(targetDirectory, kind) {
  if (kind === 'host') {
    await Promise.all([
      rm(join(targetDirectory, 'src/client'), { recursive: true, force: true }),
      rm(join(targetDirectory, 'src/core'), { recursive: true, force: true }),
      rm(join(targetDirectory, 'tests/client.test.ts'), { force: true }),
    ])
  } else if (kind === 'client') {
    await rm(join(targetDirectory, 'src/core'), { recursive: true, force: true })
  }
}

async function selectedTemplate(templateFile, outputRelativePath, variables) {
  if (variables.capability === 'tool' && outputRelativePath === 'src/index.ts') {
    return readFile(join(assetsDirectory, 'tool-index.ts.tmpl'), 'utf8')
  }
  if (variables.capability === 'tool' && outputRelativePath === 'tests/host.test.ts') {
    return readFile(join(assetsDirectory, 'tool-host.test.ts.tmpl'), 'utf8')
  }
  return readFile(templateFile, 'utf8')
}

async function writeTemplate(targetDirectory, templateFile, variables) {
  const templatePath = relative(templateDirectory, templateFile)
  const outputRelativePath = templatePath.endsWith('.tmpl')
    ? templatePath.slice(0, -'.tmpl'.length)
    : templatePath
  const outputPath = join(targetDirectory, outputRelativePath)
  await mkdir(dirname(outputPath), { recursive: true })

  if (outputRelativePath === 'package.json') {
    const manifest = createManifest(variables)
    await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`)
    return
  }

  const source = await selectedTemplate(templateFile, outputRelativePath, variables)
  await writeFile(outputPath, renderTemplate(source, templateVariables(variables)))
}

async function scaffold(options) {
  const targetDirectory = resolve(options.directory)
  await ensureTargetAvailable(targetDirectory)
  await mkdir(targetDirectory, { recursive: true })

  const templateFiles = await walkFiles(templateDirectory)
  for (const templateFile of templateFiles) {
    await writeTemplate(targetDirectory, templateFile, options)
  }
  await removeKindFiles(targetDirectory, options.kind)

  return targetDirectory
}

async function main(argv = process.argv.slice(2)) {
  const options = parseOptions(argv)
  if (options.help) {
    printHelp()
    return
  }

  const targetDirectory = await scaffold(options)
  console.log(`已生成 DSH ${options.kind}/${options.capability} 插件：${targetDirectory}`)
  console.log('下一步：')
  console.log(`  cd ${targetDirectory}`)
  console.log('  pnpm install')
  if (options.capability === 'tool') {
    console.log('  若公共 registry 的 DSH peer cohort 不完整，可先用 pnpm install --config.auto-install-peers=false 做隔离构建；真实集成仍须在目标 DSH checkout/profile 验证')
  }
  console.log('  pnpm typecheck')
  console.log('  pnpm test')
  console.log('  pnpm build')
  console.log(`  node ${join(scriptDirectory, 'validate.mjs')} ${targetDirectory} --json`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  })
}
