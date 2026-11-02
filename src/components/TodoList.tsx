import type { Todo } from '../db/todos'
import { emptyMessage, type Filter } from '../lib/filter'
import { PAGE_SIZE } from '../lib/pagination'
import { TodoEditForm } from './TodoEditForm'
import { TodoItem } from './TodoItem'

type Props = {
  todos: Todo[]
  filter: Filter
  page: number
  editingId?: number
  editError?: string
  editTitle?: string
}

export function TodoList({
  todos,
  filter,
  page,
  editingId,
  editError,
  editTitle,
}: Props) {
  const sortable = filter === 'all'
  const startIndex = (page - 1) * PAGE_SIZE

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
          const index = startIndex + offset + 1

          return todo.id === editingId ? (
            <TodoEditForm
              key={todo.id}
              todo={todo}
              filter={filter}
              page={page}
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
              page={page}
              showDrag={sortable}
            />
          )
        })
      )}
    </ul>
  )
}
