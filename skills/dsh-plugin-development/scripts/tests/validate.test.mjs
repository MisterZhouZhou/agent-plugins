import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const scaffoldScript = fileURLToPath(new URL('../scaffold.mjs', import.meta.url))
const validateScript = fileURLToPath(new URL('../validate.mjs', import.meta.url))

async function createProject(kind = 'fullstack') {
  const root = await mkdtemp(join(tmpdir(), 'dsh-validate-'))
  const target = join(root, 'plugin')
  const scaffold = spawnSync(process.execPath, [
    scaffoldScript,
    '--name', `validate-${kind}`,
    '--directory', target,
    '--kind', kind,
    '--package-name', `@acme/dsh-validate-${kind}`,
    '--dsh-range', '>=0.1.0',
  ], { encoding: 'utf8' })
  assert.equal(scaffold.status, 0, scaffold.stderr)
  return { root, target }
}

function validate(target) {
  const result = spawnSync(process.execPath, [validateScript, target, '--json', '--skip-pack'], { encoding: 'utf8' })
  assert.equal(result.stderr, '', result.stderr)
  return { ...result, json: JSON.parse(result.stdout) }
}

test('合法的 fullstack 工程通过发布前校验', async () => {
  const { root, target } = await createProject()
  try {
    const result = validate(target)
    assert.equal(result.status, 0)
    assert.equal(result.json.ok, true)
    assert.deepEqual(result.json.errors, [])
    assert.ok(result.json.checks.some((check) => check.name === 'PACK_SKIPPED'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('缺少 Cordis patch 时失败并返回 PATCH_MISSING', async () => {
  const { root, target } = await createProject()
  try {
    await rm(join(target, 'cordis.patch.yml'))
    const result = validate(target)
    assert.equal(result.status, 1)
    assert.equal(result.json.ok, false)
    assert.ok(result.json.errors.some((error) => error.code === 'PATCH_MISSING'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('残留模板占位符时失败', async () => {
  const { root, target } = await createProject('host')
  try {
    const readmePath = join(target, 'README.md')
    await writeFile(readmePath, `${await readFile(readmePath, 'utf8')}\n__UNRESOLVED_VALUE__\n`)
    const result = validate(target)
    assert.equal(result.status, 1)
    assert.ok(result.json.errors.some((error) => error.code === 'UNRESOLVED_PLACEHOLDER'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('Client manifest 缺少 client export 时失败', async () => {
  const { root, target } = await createProject('client')
  try {
    const packagePath = join(target, 'package.json')
    const manifest = JSON.parse(await readFile(packagePath, 'utf8'))
    delete manifest.exports['./client']
    await writeFile(packagePath, `${JSON.stringify(manifest, null, 2)}\n`)
    const result = validate(target)
    assert.equal(result.status, 1)
    assert.ok(result.json.errors.some((error) => error.code === 'CLIENT_CONSISTENCY'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('发现私有 monorepo 路径时失败', async () => {
  const { root, target } = await createProject('host')
  try {
    await writeFile(join(target, 'private-import.ts'), "import x from 'dsh-web/shared/private'\n")
    const result = validate(target)
    assert.equal(result.status, 1)
    assert.ok(result.json.errors.some((error) => error.code === 'FORBIDDEN_PRIVATE_PATH'))
  } finally {
    await rm(root, { recursive: true, force: true })
  }
})

test('参数错误退出 2，帮助可用', () => {
  const invalid = spawnSync(process.execPath, [validateScript], { encoding: 'utf8' })
  assert.equal(invalid.status, 2)

  const help = spawnSync(process.execPath, [validateScript, '--help'], { encoding: 'utf8' })
  assert.equal(help.status, 0)
  assert.match(help.stdout, /--json/)
  assert.match(help.stdout, /--skip-pack/)
})
