import { HelpContent } from './HelpContent'

export function HelpDialog() {
  return (
    <dialog
      id="help-dialog"
      class="help-dialog"
      aria-labelledby="help-title"
    >
      <div class="help-dialog-body">
        <header class="help-dialog-head">
          <div>
            <p class="eyebrow">Todo Studio</p>
            <h2 id="help-title">Help &amp; shortcuts</h2>
          </div>

          <form method="dialog">
            <button class="button button-ghost button-small" type="submit">
              Close
            </button>
          </form>
        </header>

        <HelpContent dialog />
      </div>
    </dialog>
  )
}
