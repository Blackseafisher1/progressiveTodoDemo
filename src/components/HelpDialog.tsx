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

        <p class="help-lead">
          Core actions use real forms and links. With JavaScript, htmx makes them
          update in place. Without it, every action reloads the page.
        </p>

        <h3 class="help-subtitle">Keyboard</h3>
        <ul class="shortcut-list">
          <li>
            <kbd>?</kbd>
            <span>Open this help dialog</span>
          </li>
          <li>
            <kbd>/</kbd>
            <span>Focus the add-todo input</span>
          </li>
          <li>
            <kbd>Esc</kbd>
            <span>Close this dialog or cancel inline editing</span>
          </li>
          <li>
            <kbd>↑</kbd>
            <kbd>↓</kbd>
            <span>
              Focus a todo title or drag handle, then swap with the previous or
              next todo
            </span>
          </li>
          <li>
            <kbd>Enter</kbd>
            <span>Submit the current form</span>
          </li>
        </ul>

        <h3 class="help-subtitle">No JavaScript</h3>
        <ul class="help-list">
          <li>Use the add, toggle, edit, and delete forms normally.</li>
          <li>Each todo has a swap field: enter a title or 1-based number.</li>
          <li>Five todos show per page; use Prev/Next to browse.</li>
          <li>Redirects include a <code>#todo-&lt;id&gt;</code> anchor so you land
            back on the relevant todo.</li>
        </ul>

        <form method="dialog" class="help-footer">
          <button class="button button-primary" type="submit">
            Back to todos
          </button>
        </form>
      </div>
    </dialog>
  )
}
