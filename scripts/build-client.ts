import { join, relative } from 'node:path'

const root = join(import.meta.dir, '..')
const outdir = join(root, 'public', 'js')

const result = await Bun.build({
  entrypoints: [join(root, 'src', 'client', 'app.ts')],
  outdir,
  target: 'browser',
  minify: Bun.env.NODE_ENV !== 'development',
  sourcemap: 'none',
})

if (!result.success) {
  for (const log of result.logs) console.error(log)
  process.exit(1)
}

for (const output of result.outputs) {
  console.log(`built ${relative(root, output.path)}`)
}
