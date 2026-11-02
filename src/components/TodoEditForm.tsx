import type { Todo } from '../db/todos'
import { filterHref, type Filter } from '../lib/filter'

type Props = {
  todo: Todo
  filter: Filter
  index?: number
  error?: string
  title?: string
}

export function TodoEditForm({
  todo,
  filter,
  index,
  error,
  title,
}: Props) {
  const action = `/todos/${todo.id}/update?filter=${filter}`
  const errorId = `edit-error-${todo.id}`
  const cancelHref = `${filterHref(filter)}#todo-${todo.id}`

  return (
    <li
      id={`todo-${todo.id}`}
      class="todo-item is-editing"
      data-id={todo.id}
      data-index={index}
      data-done={todo.done ? 'true' : 'false'}
    >
      {index ? (
        <span class="todo-index" aria-label={`Position ${index}`}>
          {index}
        </span>
      ) : null}

      <form
        class="todo-edit-form"
        method="post"
        action={action}
        hx-post={action}
        hx-target="closest li"
        hx-swap="outerHTML"
      >
        <label class="sr-only" for={`edit-todo-${todo.id}`}>
          Todo title
        </label>
        <input
          id={`edit-todo-${todo.id}`}
          class="todo-edit-input"
          type="text"
          name="title"
          value={title ?? todo.title}
          maxlength={200}
          required
          autofocus
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={error ? errorId : undefined}
        />
        <div class="todo-edit-actions">
          <button class="button button-primary button-small" type="submit">
            Save
          </button>
          <a
            class="button button-ghost button-small"
            href={cancelHref}
            hx-get={`/todos/${todo.id}?filter=${filter}`}
            hx-target="closest li"
            hx-swap="outerHTML"
            data-cancel-edit
          >
            Cancel
          </a>
        </div>
        {error ? (
          <p id={errorId} class="form-error" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </li>
  )
}
