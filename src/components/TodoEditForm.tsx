import type { Todo } from '../db/todos'
import type { Filter } from '../lib/filter'
import { pageHref } from '../lib/pagination'

type Props = {
  todo: Todo
  filter: Filter
  page: number
  index?: number
  error?: string
  title?: string
}

export function TodoEditForm({
  todo,
  filter,
  page,
  index,
  error,
  title,
}: Props) {
  const action = `/todos/${todo.id}/update?filter=${filter}&page=${page}`
  const errorId = `edit-error-${todo.id}`
  const cancelHref = `${pageHref(filter, page)}#todo-${todo.id}`

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
            hx-get={`/todos/${todo.id}?filter=${filter}&page=${page}`}
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
