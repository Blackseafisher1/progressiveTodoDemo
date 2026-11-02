import { TodoApp, type TodoAppProps } from '../components/TodoApp'
import { Layout } from './Layout'

export function Home(props: TodoAppProps) {
  return (
    <Layout
      title="Todos — Todo Studio"
      description="A retro todo app with no-JS forms, htmx enhancements, server-side ordering, and SQLite persistence."
    >
      <header class="site-header">
        <div class="wrap header-inner">
          <a class="brand" href="/">
            Todo<span>_Studio</span>
          </a>

          <div class="header-actions">
            <button
              class="header-link help-button"
              type="button"
              commandfor="help-dialog"
              command="show-modal"
              aria-haspopup="dialog"
              data-help-open
            >
              Help <kbd>?</kbd>
            </button>
            <noscript>
              <a
                class="header-link help-fallback"
                href="/help"
                target="_blank"
                rel="noopener"
                aria-label="Open help in a new tab"
                title="Open help in a new tab"
              >
                <span aria-hidden="true">↗</span>
              </a>
            </noscript>
            <a class="header-link" href="/">
              Home
            </a>
            <button
              class="theme-toggle"
              type="button"
              data-theme-toggle
              aria-pressed="false"
              aria-label="Toggle dark mode"
              hidden
            >
              <span aria-hidden="true">◐</span>
              <span data-theme-label>Dark</span>
            </button>
          </div>
        </div>
      </header>

      <main id="main" class="wrap page-main app-page">
        <div class="app-head">
          <div class="app-head-title">
            <p class="eyebrow">Todo Studio</p>
            <div class="app-head-line">
              <h1 id="page-title">Todos</h1>
              <noscript>
                <span class="noscript-badge" role="note">
                  No-JS mode: actions reload
                </span>
              </noscript>
            </div>
          </div>
        </div>

        <p id="reorder-status" class="sr-only" aria-live="polite"></p>

        <TodoApp {...props} />
      </main>

      <footer class="site-footer">
        <div class="wrap">
          Real forms and links first. htmx and TypeScript are enhancements.
        </div>
      </footer>
    </Layout>
  )
}
