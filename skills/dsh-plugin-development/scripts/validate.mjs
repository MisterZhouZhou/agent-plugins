#!/usr/bin/env node

import { execFile } from 'node:child_process'
import { access, readFile, stat } from 'node:fs/promises'
import { promisify } from 'node:util'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { walkFiles } from './lib.mjs'

const execFileAsync = promisify(execFile)
const scriptPath = fileURLToPath(import.meta.url)

function printHelp() {
  console.log(`用法：node validate.mjs <project> [--json] [--skip-pack]

执行 DSH 插件发布前静态校验。

参数：
  <project>    插件项目目录
  --json       只输出机器可读 JSON
  --skip-pack  跳过 npm pack --dry-run；适合未安装依赖的快速检查
  --help       显示帮助

退出码：0=通过，1=校验失败，2=参数或环境错误。
`)
}

function addCheck(result, name, ok, detail) {
  result.checks.push({ name, ok, detail })
  if (!ok) result.errors.push({ code: name, message: detail })
}

function addWarning(result, code, message) {
  result.warnings.push({ code, message })
}

function parseValidateArgs(argv) {
  const positional = []
  let json = false
  let skipPack = false

  for (const token of argv) {
    if (token === '--help') return { help: true }
    if (token === '--json') {
      json = true
      continue
    }
    if (token === '--skip-pack') {
      skipPack = true
      continue
    }
    if (token.startsWith('--')) throw new TypeError(`未知参数：${token}`)
    positional.push(token)
  }

  if (positional.length !== 1) {
    throw new TypeError('必须提供且只能提供一个 project 目录')
  }
  return { project: positional[0], json, skipPack }
}

async function pathExists(path) {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

async function readText(path) {
  return readFile(path, 'utf8')
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim() !== ''
}

function isClearlyInvalidRange(value) {
  if (!isNonEmptyString(value)) return true
  return /[\u0000\n\r]/.test(value) || /^(?:undefined|null|invalid|none)$/i.test(value.trim())
}

function normalizeExportPath(value) {
  return typeof value === 'string' ? value.replace(/^\.\//, '') : ''
}

function exportTarget(exportsField, key, condition = 'default') {
  const entry = exportsField?.[key]
  if (typeof entry === 'string') return entry
  if (!entry || typeof entry !== 'object') return ''
  return entry[condition] || entry.import || entry.require || entry.default || ''
}

function filesCover(files, expected) {
  return files.some((entry) => {
    if (typeof entry !== 'string') return false
    const normalized = normalizeExportPath(entry)
    return normalized === expected || normalized === expected.split('/')[0] || normalized.endsWith('/**') && expected.startsWith(normalized.slice(0, -3))
  })
}

function extractPatchPackageName(source) {
  const match = source.match(/(?:^|\n)\s*name:\s*['"]([^'"]+)['"]/) || source.match(/(?:^|\n)\s*name:\s*([^\s#]+)/)
  return match?.[1] || ''
}

function parsePackJson(stdout) {
  for (let offset = stdout.indexOf('['); offset >= 0; offset = stdout.indexOf('[', offset + 1)) {
    try {
      return JSON.parse(stdout.slice(offset))
    } catch {
      // npm lifecycle scripts may write logs before the JSON payload.
    }
  }
  return null
}

async function checkPack(result, projectDirectory, manifest) {
  try {
    const { stdout } = await execFileAsync('npm', ['pack', '--dry-run', '--json'], {
      cwd: projectDirectory,
      encoding: 'utf8',
      maxBuffer: 4 * 1024 * 1024,
    })
    let packOutput
    try {
      packOutput = parsePackJson(stdout)
    } catch {
      addWarning(result, 'PACK_OUTPUT_UNPARSEABLE', 'npm pack 已成功，但输出不是 JSON，无法展示文件表。')
      return
    }
    const files = packOutput?.[0]?.files
    if (Array.isArray(files)) {
      const paths = files.map((file) => file.path).filter(Boolean)
      const declaredTargets = [
        exportTarget(manifest.exports, '.'),
        manifest.types || exportTarget(manifest.exports, '.', 'types'),
        exportTarget(manifest.exports, './client'),
        exportTarget(manifest.exports, './client', 'types'),
      ]
        .filter(isNonEmptyString)
        .map(normalizeExportPath)
      const requiredPaths = [...new Set([
        'package.json',
        normalizeExportPath(manifest.dsh?.bundle?.patch),
        'README.md',
        'LICENSE',
        ...declaredTargets,
      ].filter(isNonEmptyString))]
      const missingPaths = requiredPaths.filter((required) => !paths.includes(required))
      for (const required of missingPaths) {
        addCheck(result, 'PACK_CONTENT_MISSING', false, `tarball 缺少声明的文件：${required}`)
      }
      result.checks.push({
        name: 'PACK_CONTENT',
        ok: missingPaths.length === 0,
        detail: missingPaths.length === 0
          ? `npm pack 将包含 ${paths.length} 个文件，且所有公开入口/类型声明均在包内`
          : `npm pack 将包含 ${paths.length} 个文件，但缺少 ${missingPaths.length} 个必需文件`,
      })
    } else {
      addWarning(result, 'PACK_CONTENT_UNKNOWN', 'npm pack 未返回可识别的文件表。')
    }
  } catch (error) {
    const detail = error?.stderr?.trim() || error?.message || String(error)
    addCheck(result, 'PACK_FAILED', false, `npm pack --dry-run 失败：${detail}`)
  }
}

/**
 * 校验独立 DSH 插件项目。
 * @param {string} projectPath
 * @param {{skipPack?: boolean}} [options]
 */
export async function validateProject(projectPath, options = {}) {
  const result = { ok: false, errors: [], warnings: [], checks: [] }
  const projectDirectory = resolve(projectPath)

  let projectStat
  try {
    projectStat = await stat(projectDirectory)
  } catch (error) {
    if (error?.code === 'ENOENT') {
      addCheck(result, 'PROJECT_MISSING', false, `项目目录不存在：${projectDirectory}`)
      return result
    }
    throw error
  }
  if (!projectStat.isDirectory()) {
    addCheck(result, 'PROJECT_NOT_DIRECTORY', false, `项目路径不是目录：${projectDirectory}`)
    return result
  }

  const packagePath = join(projectDirectory, 'package.json')
  let manifest
  try {
    manifest = JSON.parse(await readText(packagePath))
    result.checks.push({ name: 'PACKAGE_JSON', ok: true, detail: 'package.json 可解析' })
  } catch (error) {
    addCheck(result, 'PACKAGE_JSON_INVALID', false, `package.json 不存在或不可解析：${error.message}`)
    return result
  }

  addCheck(result, 'PACKAGE_NAME', isNonEmptyString(manifest.name), 'package.json.name 必须是非空字符串')
  addCheck(result, 'PACKAGE_VERSION', isNonEmptyString(manifest.version), 'package.json.version 必须是非空字符串')
  addCheck(result, 'PACKAGE_TYPE', manifest.type === 'module', 'package.json.type 必须为 module')
  addCheck(result, 'PACKAGE_MAIN', isNonEmptyString(manifest.main), 'package.json.main 必须是非空字符串')
  addCheck(result, 'PACKAGE_PUBLIC', manifest.private !== true, '发布包不能设置 private: true')

  const rootExport = exportTarget(manifest.exports, '.')
  addCheck(result, 'ROOT_EXPORT', Boolean(rootExport), 'exports 必须包含根入口 .')
  if (rootExport) {
    const rootPath = join(projectDirectory, normalizeExportPath(rootExport))
    if (await pathExists(rootPath)) {
      result.checks.push({ name: 'ROOT_EXPORT_TARGET', ok: true, detail: `根入口目标存在：${rootExport}` })
    } else {
      addWarning(result, 'ROOT_EXPORT_TARGET_MISSING', `根入口目标尚未生成：${rootExport}；请在 npm pack 前先运行 build。`)
    }
  }

  const rootTypesTarget = manifest.types || exportTarget(manifest.exports, '.', 'types')
  if (isNonEmptyString(rootTypesTarget)) {
    if (await pathExists(join(projectDirectory, normalizeExportPath(rootTypesTarget)))) {
      result.checks.push({ name: 'ROOT_TYPES_TARGET', ok: true, detail: `根类型声明存在：${rootTypesTarget}` })
    } else {
      addWarning(result, 'ROOT_TYPES_TARGET_MISSING', `根类型声明尚未生成：${rootTypesTarget}；请在 npm pack 前先运行 build。`)
    }
  }

  const patchRelative = manifest.dsh?.bundle?.patch
  addCheck(result, 'PATCH_DECLARATION', isNonEmptyString(patchRelative), 'dsh.bundle.patch 必须是非空路径')
  let patchPath = ''
  if (isNonEmptyString(patchRelative)) {
    patchPath = join(projectDirectory, normalizeExportPath(patchRelative))
    if (await pathExists(patchPath)) {
      result.checks.push({ name: 'PATCH_EXISTS', ok: true, detail: `Cordis patch 存在：${patchRelative}` })
      try {
        const patchName = extractPatchPackageName(await readText(patchPath))
        addCheck(result, 'PATCH_NAME', patchName === manifest.name, `patch name 必须等于 package name（当前为 ${patchName || '空'}）`)
      } catch (error) {
        addCheck(result, 'PATCH_READABLE', false, `无法读取 Cordis patch：${error.message}`)
      }
    } else {
      addCheck(result, 'PATCH_MISSING', false, `Cordis patch 不存在：${patchRelative}`)
    }
  }

  const dshRange = manifest.dsh?.engines?.dsh
  addCheck(result, 'DSH_ENGINE', !isClearlyInvalidRange(dshRange), 'dsh.engines.dsh 必须是非空且看起来合法的版本范围')

  const hostSourcePath = join(projectDirectory, 'src/index.ts')
  if (await pathExists(hostSourcePath)) {
    try {
      const hostSource = await readText(hostSourcePath)
      const declaresConfigType = /export\s+(?:interface|type)\s+Config\b/.test(hostSource)
      const exportsRuntimeConfig = /export\s+const\s+Config\s*(?::[^=]+)?=/.test(hostSource)
      if (declaresConfigType && !exportsRuntimeConfig) {
        addWarning(result, 'CONFIG_SCHEMA', 'src/index.ts 声明了 Config 类型，但没有导出同名运行时 Schema；Cordis 将无法校验配置和填充默认值。')
      }
      if (exportsRuntimeConfig) {
        const dependencies = { ...manifest.devDependencies, ...manifest.dependencies }
        if (!dependencies['@deepseek-ai/schemastery']) {
          addWarning(result, 'CONFIG_SCHEMA_DEPENDENCY', '检测到运行时 Config schema，但 package.json 未声明 @deepseek-ai/schemastery。')
        }
      }
    } catch (error) {
      addWarning(result, 'HOST_SOURCE_UNREADABLE', `无法读取 Host 入口以检查 Config schema：${error.message}`)
    }
  }

  const dependencyMap = { ...manifest.devDependencies, ...manifest.dependencies }
  if (await pathExists(hostSourcePath)) {
    try {
      const hostSource = await readText(hostSourcePath)
      const looksLikeTool = /\bdefineTool\b|ctx\.tools\.register/.test(hostSource)
      if (looksLikeTool) {
        const hasToolsDependency = isNonEmptyString(dependencyMap['@deepseek-ai/dsh-tools'])
        addCheck(result, 'TOOL_DEPENDENCY', hasToolsDependency, '使用 defineTool/ctx.tools.register 时必须声明 @deepseek-ai/dsh-tools')
        const declaresToolsInject = /export\s+const\s+inject\s*=\s*\[[^\]]*['\"]tools['\"]/s.test(hostSource)
        addCheck(result, 'TOOL_INJECT', declaresToolsInject, 'Tool 插件必须通过 inject 声明 tools 服务依赖')
      }
    } catch (error) {
      addWarning(result, 'TOOL_SOURCE_UNREADABLE', `无法读取 Host 入口以检查 Tool 契约：${error.message}`)
    }
  }

  const clientSourcePath = join(projectDirectory, 'src/client/index.ts')
  const hasClientSource = await pathExists(clientSourcePath)
  const clientDeclaration = manifest.dsh?.client
  const clientExport = Boolean(exportTarget(manifest.exports, './client'))
  const clientSourceConsistent = Boolean(clientDeclaration) === hasClientSource && clientExport === hasClientSource
  addCheck(result, 'CLIENT_CONSISTENCY', clientSourceConsistent, 'dsh.client、exports["./client"] 和 src/client/index.ts 必须同时存在或同时不存在')
  if (clientExport) {
    const clientTarget = exportTarget(manifest.exports, './client')
    if (!(await pathExists(join(projectDirectory, normalizeExportPath(clientTarget))))) {
      addWarning(result, 'CLIENT_EXPORT_TARGET_MISSING', `Client 入口目标尚未生成：${clientTarget}；请在 npm pack 前先运行 build。`)
    }
    const clientTypesTarget = exportTarget(manifest.exports, './client', 'types')
    if (clientTypesTarget) {
      if (await pathExists(join(projectDirectory, normalizeExportPath(clientTypesTarget)))) {
        result.checks.push({ name: 'CLIENT_TYPES_TARGET', ok: true, detail: `Client 类型声明存在：${clientTypesTarget}` })
      } else {
        addWarning(result, 'CLIENT_TYPES_TARGET_MISSING', `Client 类型声明尚未生成：${clientTypesTarget}；请在 npm pack 前先运行 build。`)
      }
    }
  }

  const files = Array.isArray(manifest.files) ? manifest.files : []
  addCheck(result, 'FILES_DECLARATION', files.length > 0, 'package.json.files 必须声明发布文件')
  for (const required of ['cordis.patch.yml', 'README.md', 'LICENSE', 'lib']) {
    if (files.length > 0) addCheck(result, `FILES_${required.toUpperCase().replaceAll(/[^A-Z0-9]+/g, '_')}`, filesCover(files, required), `package.json.files 必须覆盖 ${required}`)
  }

  const allFiles = await walkFiles(projectDirectory)
  for (const path of allFiles) {
    const pathRelative = relative(projectDirectory, path)
    if (pathRelative === 'node_modules' || pathRelative.startsWith('node_modules/')) continue
    if (pathRelative === '.git' || pathRelative.startsWith('.git/')) continue
    if (pathRelative.endsWith('.tgz')) continue
    let source
    try {
      source = await readText(path)
    } catch {
      continue
    }
    if (source.includes('dsh-web/shared')) {
      addCheck(result, 'FORBIDDEN_PRIVATE_PATH', false, `发现禁止的 monorepo 私有路径：${pathRelative}`)
    }
    if (source.includes('@linxin666')) {
      addCheck(result, 'FORBIDDEN_SCOPE', false, `发现禁止的固定第三方 scope：${pathRelative}`)
    }
    if (/__[A-Z0-9_]+__/.test(source)) {
      addCheck(result, 'UNRESOLVED_PLACEHOLDER', false, `发现未替换模板占位符：${pathRelative}`)
    }
  }

  if (options.skipPack) {
    result.checks.push({ name: 'PACK_SKIPPED', ok: true, detail: '按参数跳过 npm pack --dry-run' })
  } else {
    await checkPack(result, projectDirectory, manifest)
  }

  result.ok = result.errors.length === 0
  return result
}

export function formatHumanResult(result, projectDirectory) {
  const lines = [`DSH 插件校验：${projectDirectory}`]
  for (const check of result.checks) {
    lines.push(`${check.ok ? 'PASS' : 'FAIL'} ${check.name}: ${check.detail}`)
  }
  for (const warning of result.warnings) lines.push(`WARN ${warning.code}: ${warning.message}`)
  lines.push(result.ok ? '结果：PASS' : `结果：FAIL（${result.errors.length} 项错误）`)
  return lines.join('\n')
}

async function main(argv = process.argv.slice(2)) {
  const options = parseValidateArgs(argv)
  if (options.help) {
    printHelp()
    return 0
  }
  const result = await validateProject(options.project, options)
  if (options.json) console.log(JSON.stringify(result, null, 2))
  else console.log(formatHumanResult(result, resolve(options.project)))
  return result.ok ? 0 : 1
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().then((exitCode) => {
    process.exitCode = exitCode
  }).catch((error) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 2
  })
}
