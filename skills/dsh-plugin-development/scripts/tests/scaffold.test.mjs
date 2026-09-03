import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const script = fileURLToPath(new URL('../scaffold.mjs', import.meta.url))

function run(args) {
  return spawnSync(process.execPath, [script, ...args], { encoding: 'utf8' })
}

async function makeTarget(prefix = 'dsh-skill-') {
  const root = await mkdtemp(join(tmpdir(), prefix))
  return { root, target: join(root, 'demo-plugin') }
}

function requiredArgs(target, overrides = {}) {
  return [
    '--name', 'demo-plugin',
    '--directory', target,
    '--kind', 'fullstack',
    '--package-name', '@acme/dsh-demo-plugin',
    '--dsh-range', '>=0.1.0',
    ...Object.entries(overrides).flatMap(([key, value]) => [`--${key}`, value]),
  ]
}

test('fullstack 生成 host、core 和 client，并处理完整 manifest', async () => {
  const { target } = await makeTarget()
  const result = run(requiredArgs(target))
  assert.equal(result.status, 0, result.stderr)

  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@acme/dsh-demo-plugin')
  assert.equal(manifest.dsh.bundle.patch, './cordis.patch.yml')
  assert.equal(manifest.exports['./client'].default, './lib/client.js')
  assert.deepEqual(manifest.dsh.client, {
    platform: 'web',
    inject: ['@deepseek-ai/dsh-client-runtime'],
  })
  assert.equal(manifest.private, undefined)
  assert.equal(manifest.scripts.build, 'tsdown')
  assert.equal(manifest.scripts.prepare, 'npm run build')
  assert.equal(manifest.scripts.watch, 'tsdown --watch')
  assert.equal(manifest.scripts.test, 'vitest run')
  assert.equal(manifest.scripts.typecheck, 'tsc -p tsconfig.build.json --noEmit')
  assert.deepEqual(manifest.files, ['lib', 'cordis.patch.yml', 'README.md', 'LICENSE'])
  assert.equal(manifest.devDependencies['@deepseek-ai/cordis'], '^4.0.2')
  assert.equal(manifest.devDependencies['@deepseek-ai/dsh-client-connection'], '^0.1.2-alpha.4')

  const patch = await readFile(join(target, 'cordis.patch.yml'), 'utf8')
  const readme = await readFile(join(target, 'README.md'), 'utf8')
  assert.match(patch, /id: demo-plugin/)
  assert.match(patch, /name: '@acme\/dsh-demo-plugin'/)
  assert.doesNotMatch(readme, /__[A-Z0-9_]+__/)
  assert.match(readme, /2026-09-02 调研基线/)
  assert.match(readme, /DSH：`>=0\.1\.0`/)
})

test('host 只生成 Host 入口并删除 Client、Core 和对应 manifest 字段', async () => {
  const { target } = await makeTarget()
  const result = run(requiredArgs(target, { kind: 'host', 'package-name': 'dsh-demo-plugin' }))
  assert.equal(result.status, 0, result.stderr)

  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(manifest.exports['./client'], undefined)
  assert.equal(manifest.dsh.client, undefined)
  assert.equal(manifest.devDependencies['@deepseek-ai/dsh-client-connection'], undefined)
  assert.equal(manifest.devDependencies['@deepseek-ai/cordis'], '^4.0.2')

  assert.match(result.stdout, /下一步：/)
  await assert.rejects(readFile(join(target, 'src', 'client', 'index.ts')))
  await assert.rejects(readFile(join(target, 'src', 'core', 'index.ts')))
  await assert.rejects(readFile(join(target, 'tests', 'client.test.ts')))
  assert.match(await readFile(join(target, 'src', 'index.ts'), 'utf8'), /demo-plugin/)
  assert.match(await readFile(join(target, 'tests', 'host.test.ts'), 'utf8'), /demo-plugin/)
})

test('client 删除 Core 但保留无业务 Node 入口和 Client manifest', async () => {
  const { target } = await makeTarget()
  const result = run(requiredArgs(target, { kind: 'client', 'package-name': '@acme/dsh-demo-client' }))
  assert.equal(result.status, 0, result.stderr)

  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(manifest.name, '@acme/dsh-demo-client')
  assert.equal(manifest.exports['./client'].default, './lib/client.js')
  assert.ok(manifest.dsh.client)
  assert.equal(manifest.devDependencies['@deepseek-ai/dsh-client-connection'], '^0.1.2-alpha.4')

  await assert.rejects(readFile(join(target, 'src', 'core', 'index.ts')))
  assert.match(await readFile(join(target, 'src', 'index.ts'), 'utf8'), /export function apply/)
  assert.match(await readFile(join(target, 'src', 'client', 'index.ts'), 'utf8'), /demo-plugin-client/)
  assert.match(await readFile(join(target, 'tests', 'client.test.ts'), 'utf8'), /demo-plugin-client/)
})

test('支持覆盖兼容版本并替换所有模板占位符', async () => {
  const { target } = await makeTarget()
  const result = run(requiredArgs(target, {
    'cordis-version': '^4.2.0',
    'sdk-version': '^0.2.0',
    'package-name': '@scope/dsh-special-plugin',
  }))
  assert.equal(result.status, 0, result.stderr)

  const manifest = JSON.parse(await readFile(join(target, 'package.json'), 'utf8'))
  assert.equal(manifest.devDependencies['@deepseek-ai/cordis'], '^4.2.0')
  assert.equal(manifest.devDependencies['@deepseek-ai/dsh-client-connection'], '^0.2.0')
  for (const file of ['README.md', 'LICENSE', 'cordis.patch.yml', 'package.json']) {
    assert.doesNotMatch(await readFile(join(target, file), 'utf8'), /__[A-Z0-9_]+__/)
  }
})

test('非法名称、非法形态和缺失必需参数均以状态码 2 退出', async () => {
  const { target } = await makeTarget()
  for (const args of [
    requiredArgs(target, { name: 'DemoPlugin' }),
    requiredArgs(target, { kind: 'unknown' }),
    requiredArgs(target, { 'package-name': '   ' }),
    requiredArgs(target, { 'dsh-range': '   ' }),
    ['--name', 'demo-plugin'],
  ]) {
    const result = run(args)
    assert.equal(result.status, 2, `${args.join(' ')}\n${result.stderr}`)
  }
})

test('拒绝非空目录且不覆盖既有文件', async () => {
  const { target } = await makeTarget()
  await mkdir(target)
  const keepFile = join(target, 'keep.txt')
  await writeFile(keepFile, 'keep')

  const result = run(requiredArgs(target, { kind: 'host', 'package-name': 'dsh-demo-plugin' }))
  assert.equal(result.status, 2)
  assert.equal(await readFile(keepFile, 'utf8'), 'keep')
})

test('--help 展示参数、三种插件形态和版本基线说明', () => {
  const result = run(['--help'])
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /host\|client\|fullstack/)
  assert.match(result.stdout, /--cordis-version/)
  assert.match(result.stdout, /--sdk-version/)
  assert.match(result.stdout, /2026-09-02/)
})
