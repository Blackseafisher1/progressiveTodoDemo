import type { Todo } from '../db/todos'
import { emptyMessage, type Filter } from '../lib/filter'
import { TodoEditForm } from './TodoEditForm'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  filter: Filter
  editingId?: number
  editError?: string
  editTitle?: string
}

export function TodoList({
  todos,
  filter,
  editingId,
  editError,
  editTitle,
}: Props) {
  const sortable = filter === 'all'

  return (
    <ul
      id="todo-list"
      class="todo-list"
      data-sortable={sortable ? 'true' : undefined}
      aria-label="Todo list"
    >
      {todos.length === 0 ? (
        <li class="todo-empty" role="status">
          {emptyMessage(filter)}
        </li>
      ) : (
        todos.map((todo, offset) => {
          const index = offset + 1

          return todo.id === editingId ? (
            <TodoEditForm
              key={todo.id}
              todo={todo}
              filter={filter}
              index={index}
              error={editError}
              title={editTitle}
            />
          ) : (
            <TodoItem
              key={todo.id}
              todo={todo}
              filter={filter}
              index={index}
              showDrag={sortable}
            />
          )
        })
      )}
    </ul>
  )
}
