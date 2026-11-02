import { Layout } from './Layout'

export function Landing() {
  return (
    <Layout
      title="Todo Studio — a progressive enhancement blueprint"
      description="A small retro todo demo built with Hono, htmx, Bun, and SQLite. Core actions work without JavaScript."
    >
      <main id="main" class="landing">
        <div class="landing-card">
          <p class="eyebrow">Progressive enhancement blueprint</p>
          <h1>Todo Studio</h1>
          <p class="lead">
            A tiny todo app that works without JavaScript. htmx upgrades the same
            forms and links when it is available.
          </p>

          <a class="button button-primary button-large" href="/app">
            Open the todo app →
          </a>

          <ul class="badges" aria-label="Demo highlights">
            <li>No-JS core</li>
            <li>htmx enhanced</li>
            <li>SQLite</li>
            <li>One CSS bundle</li>
            <li>One TS bundle</li>
          </ul>
        </div>
      </main>
    </Layout>
  )
}
