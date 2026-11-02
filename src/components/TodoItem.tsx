import type { Todo } from '../db/todos'
import type { Filter } from '../lib/filter'

type Props = {
  todo: Todo
  filter: Filter
  index: number
  page: number
  showDrag?: boolean
}

export function TodoItem({
  todo,
  filter,
  index,
  page,
  showDrag = false,
}: Props) {
  const toggleHref = `/todos/${todo.id}/toggle?filter=${filter}&page=${page}`
  const editHref = `/todos/${todo.id}/edit?filter=${filter}&page=${page}`
  const deleteHref = `/todos/${todo.id}/delete?filter=${filter}&page=${page}`
  const swapHref = `/todos/swap?filter=${filter}&page=${page}`

  return (
    <li
      id={`todo-${todo.id}`}
      class="todo-item"
      data-id={todo.id}
      data-index={index}
      data-done={todo.done ? 'true' : 'false'}
    >
      <div class="todo-main">
        {showDrag ? (
          <button
            class="drag-handle"
            type="button"
            data-drag-handle
            aria-label={`Reorder ${todo.title}`}
            aria-keyshortcuts="ArrowUp ArrowDown"
            title="Drag, or focus and use the arrow keys"
          >
            <span aria-hidden="true">⠿</span>
          </button>
        ) : null}

        <span class="todo-index" aria-label={`Position ${index}`}>
          {index}
        </span>

        <form
          class="todo-toggle-form"
          method="post"
          action={toggleHref}
          hx-post={toggleHref}
          hx-target="#todo-app"
          hx-swap="outerHTML"
        >
          <button
            class={todo.done ? 'todo-check is-done' : 'todo-check'}
            type="submit"
            aria-pressed={todo.done ? 'true' : 'false'}
            aria-label={
              todo.done
                ? `Mark ${todo.title} as active`
                : `Mark ${todo.title} as done`
            }
          >
            {todo.done ? '✓' : ''}
          </button>
        </form>

        <a
          class="todo-title"
          href={`${editHref}#todo-${todo.id}`}
          hx-get={editHref}
          hx-target="closest li"
          hx-swap="outerHTML"
          aria-label={`Edit ${todo.title}. Focus and use ArrowUp or ArrowDown to swap.`}
          aria-keyshortcuts="ArrowUp ArrowDown"
        >
          {todo.title}
        </a>

        <div class="todo-actions">
          <form
            class="todo-delete-form"
            method="post"
            action={deleteHref}
            hx-post={deleteHref}
            hx-target="#todo-app"
            hx-swap="outerHTML"
            hx-confirm="Delete this todo?"
          >
            <button
              class="button button-danger button-small"
              type="submit"
              aria-label={`Delete ${todo.title}`}
            >
              Delete
            </button>
          </form>

          <form
            class="todo-swap-form nojs-only"
            method="post"
            action={swapHref}
            aria-label={`Swap ${todo.title} with another todo`}
            autocomplete="off"
          >
            <input type="hidden" name="a" value={index} />

            <label class="sr-only" for={`swap-with-${todo.id}`}>
              Swap {todo.title} with
            </label>
            <input
              id={`swap-with-${todo.id}`}
              name="b"
              type="text"
              placeholder="Swap with"
              maxlength={200}
              required
            />

            <button
              class="button button-ghost button-small"
              type="submit"
              aria-label={`Swap ${todo.title}`}
            >
              Swap
            </button>
          </form>
        </div>
      </div>
    </li>
  )
}
