#!/usr/bin/env node
// Manual FTP deploy — the local fallback for the CI deploy
// (.github/workflows/deploy.yml). Run with: npm run deploy
//
// Reads FTP credentials from a git-ignored .env (see .env.example / DEPLOY.md):
//   FTP_HOST        (required)  e.g. ftp.example.com
//   FTP_USER        (required)
//   FTP_PASSWORD    (required)
//   FTP_SERVER_DIR  (optional)  remote web root, default "/"
//   FTP_SECURE      (optional)  "true" -> explicit FTPS over TLS (default false)
//
// Steps: build -> stage api/ into dist/api (minus config.php, the sample, the
// schema, and data/) -> upload dist/ over FTP. `vite build` already places the
// web-root .htaccess into dist/ (from public/).
//
// Non-destructive: config.php is never staged, and basic-ftp's uploadFromDir
// overwrites same-named files but never DELETES remote files — so the
// hand-uploaded /api/config.php and any /api/data survive every deploy.

import 'dotenv/config'
import { spawnSync } from 'node:child_process'
import { cp, rm, access } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve, join } from 'node:path'
import { Client } from 'basic-ftp'

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const distDir = join(projectRoot, 'dist')
const apiSrcDir = join(projectRoot, 'api')
const apiStageDir = join(distDir, 'api')

// api/ entries that must never reach the server via deploy.
const API_EXCLUDES = new Set([
  resolve(apiSrcDir, 'config.php'),
  resolve(apiSrcDir, 'config.sample.php'),
  resolve(apiSrcDir, 'schema.sql'),
  resolve(apiSrcDir, 'data'),
])

function requireEnv(name) {
  const value = process.env[name]
  if (!value || !value.trim()) {
    console.error(`Missing required env var ${name}. Set it in .env (see DEPLOY.md).`)
    process.exit(1)
  }
  return value.trim()
}

function build() {
  console.log('› Building (vite build)…')
  // Run the project's own build script so any future build flags are honored.
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  const result = spawnSync(npm, ['run', 'build'], { cwd: projectRoot, stdio: 'inherit' })
  if (result.status !== 0) {
    console.error('Build failed; aborting deploy.')
    process.exit(result.status ?? 1)
  }
}

async function stageApi() {
  console.log('› Staging api/ into dist/api/ (excluding config.php, the sample, schema.sql, data/)…')
  // Start from a clean stage so a previously-staged config.php can't linger.
  await rm(apiStageDir, { recursive: true, force: true })
  await cp(apiSrcDir, apiStageDir, {
    recursive: true,
    filter: (src) => !API_EXCLUDES.has(resolve(src)),
  })
}

async function preflight() {
  // Bail before uploading if the build/stage left a broken tree. vite build
  // places index.html and .htaccess (from public/) into dist/.
  for (const f of ['index.html', '.htaccess', 'api/_bootstrap.php']) {
    await access(join(distDir, f)).catch(() => {
      console.error(`dist/${f} missing — aborting before upload.`)
      process.exit(1)
    })
  }
}

async function upload() {
  const host = requireEnv('FTP_HOST')
  const user = requireEnv('FTP_USER')
  const password = requireEnv('FTP_PASSWORD')
  const serverDir = (process.env.FTP_SERVER_DIR || '/').trim()
  const secure = /^(1|true|yes)$/i.test((process.env.FTP_SECURE || '').trim())

  const client = new Client()
  client.ftp.verbose = false
  try {
    console.log(`› Connecting to ${host} (secure=${secure})…`)
    await client.access({ host, user, password, secure })

    // ensureDir creates the remote path if needed AND cd's into it; uploadFromDir
    // then writes the contents of dist/ INTO the current remote dir.
    if (serverDir && serverDir !== '/') {
      await client.ensureDir(serverDir)
    }

    console.log(`› Uploading dist/ → ${serverDir} (no deletions)…`)
    await client.uploadFromDir(distDir)

    console.log('✓ Deploy complete.')
  } catch (err) {
    console.error('Deploy failed:', err?.message || err)
    process.exitCode = 1
  } finally {
    client.close()
  }
}

build()
await stageApi()
await preflight()
await upload()
