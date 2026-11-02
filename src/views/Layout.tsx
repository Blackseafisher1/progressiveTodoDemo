import type { Child } from 'hono/jsx'
import { HelpDialog } from '../components/HelpDialog'
import { assetHrefs } from '../lib/assets'

const HTMX_CONFIG = JSON.stringify({
  responseHandling: [
    { code: '204', swap: false },
    { code: '[23]..', swap: true },
    { code: '422', swap: true },
    { code: '[45]..', swap: false },
  ],
})

const DEFAULT_TITLE = 'Todo Studio — progressive enhancement demo'
const DEFAULT_DESCRIPTION =
  'Todo Studio is a small progressive-enhancement todo demo built with Hono, htmx, Bun, and SQLite. Every core action works without JavaScript.'

type Props = {
  title?: string
  description?: string
  children: Child
}

export function Layout({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  children,
}: Props) {
  const { cssHref, jsHref } = assetHrefs()

  return (
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="color-scheme" content="light dark" />
        <meta name="theme-color" content="#f2ead8" />
        <meta name="robots" content="index, follow" />
        <meta name="description" content={description} />
        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta name="htmx-config" content={HTMX_CONFIG} />
        <title>{title}</title>
        <link rel="stylesheet" href={cssHref} />
        <script defer src="/vendor/htmx.min.js"></script>
        <script defer src={jsHref}></script>
      </head>
      <body>
        <a class="skip-link" href="#main">
          Skip to content
        </a>
        {children}
        <HelpDialog />
        <div
          id="toast-host"
          class="toast-host"
          aria-live="polite"
          aria-atomic="false"
        ></div>
      </body>
    </html>
  )
}
