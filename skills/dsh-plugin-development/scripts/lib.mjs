import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'

export function parseArgs(argv, schema) {
  const result = {}
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index]
    if (token === '--help') return { help: true }
    if (!token.startsWith('--') || !(token.slice(2) in schema)) {
      throw new TypeError(`未知参数：${token}`)
    }
    const key = token.slice(2)
    const value = argv[index + 1]
    if (value === undefined || value.startsWith('--')) {
      throw new TypeError(`参数 --${key} 缺少值`)
    }
    result[key] = value
    index += 1
  }
  return result
}

export function renderTemplate(source, variables) {
  return Object.entries(variables).reduce(
    (output, [key, value]) => output.replaceAll(`__${key}__`, String(value)),
    source,
  )
}

export async function walkFiles(root) {
  const output = []
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) output.push(...await walkFiles(path))
    else output.push(path)
  }
  return output.sort()
}

export async function readManifest(root) {
  return JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
}

export function isKebabCase(value) {
  return /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/.test(value)
}
