import { statSync } from 'node:fs'
import { join } from 'node:path'

const root = join(import.meta.dir, '..', '..')

function mtime(path: string): number {
  try {
    return Math.floor(statSync(join(root, path)).mtimeMs)
  } catch {
    return 0
  }
}

export function assetVersion(): string {
  return Math.max(
    mtime('public/styles/main.css'),
    mtime('public/js/app.js'),
  ).toString(36)
}

export function assetHrefs() {
  const version = assetVersion()

  return {
    cssHref: `/styles/main.css?v=${version}`,
    jsHref: `/js/app.js?v=${version}`,
  }
}
