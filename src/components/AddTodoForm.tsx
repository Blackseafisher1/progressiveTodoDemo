type Props = {
  error?: string
  title?: string
}

export function AddTodoForm({ error, title = '' }: Props) {
  return (
    <form
      id="add-form"
      class="add-form"
      method="post"
      action="/todos"
      hx-post="/todos"
      hx-target="#todo-app"
      hx-swap="outerHTML"
      autocomplete="off"
    >
      <label class="sr-only" for="new-todo-title">
        New todo
      </label>
      <input
        id="new-todo-title"
        class="add-input"
        type="text"
        name="title"
        placeholder="What needs doing?"
        value={title}
        maxlength={200}
        required
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? 'add-error' : undefined}
      />
      <button class="button button-primary" type="submit">
        Add
      </button>
      {error ? (
        <p id="add-error" class="form-error" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  )
}
