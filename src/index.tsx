import { join } from 'node:path'
import { Hono } from 'hono'
import { serveStatic } from 'hono/bun'
import pageRoutes from './routes/pages'
import todoRoutes from './routes/todos'

const app = new Hono()
const publicDir = join(import.meta.dir, '..', 'public')

app.use('*', async (c, next) => {
  await next()

  if (/^\/(styles|js|vendor)\//.test(c.req.path)) {
    c.header('Cache-Control', 'public, max-age=31536000, immutable')
  }
})

app.use('/styles/*', serveStatic({ root: publicDir }))
app.use('/js/*', serveStatic({ root: publicDir }))
app.use('/vendor/*', serveStatic({ root: publicDir }))

app.route('/', pageRoutes)
app.route('/', todoRoutes)

app.notFound((c) => c.text('Not found', 404))

export { app }

export default {
  port: Number(Bun.env.PORT ?? 3000),
  fetch: app.fetch,
}
