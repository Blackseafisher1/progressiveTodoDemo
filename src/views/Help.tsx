import { HelpContent } from '../components/HelpContent'
import { Layout } from './Layout'

export function Help() {
  return (
    <Layout
      title="Help & shortcuts — Todo Studio"
      description="Keyboard shortcuts and no-JavaScript instructions for Todo Studio."
    >
      <main id="main" class="wrap page-main">
        <article class="help-page-card">
          <header class="help-page-head">
            <p class="eyebrow">Todo Studio</p>
            <h1>Help &amp; shortcuts</h1>
          </header>

          <HelpContent />
        </article>
      </main>
    </Layout>
  )
}
