import type { Todo, TodoStats } from '../db/todos'
import type { Filter } from '../lib/filter'
import { AddTodoForm } from './AddTodoForm'
import { FilterBar } from './FilterBar'
import { Pagination } from './Pagination'
import { Stats } from './Stats'
import { TodoList } from './TodoList'

export type TodoAppProps = {
  filter: Filter
  todos: Todo[]
  stats: TodoStats
  page: number
  pageCount: number
  formError?: string
  draftTitle?: string
  editingId?: number
  editError?: string
  editTitle?: string
  swapError?: string
}

export function TodoApp({
  filter,
  todos,
  stats,
  page,
  pageCount,
  formError,
  draftTitle,
  editingId,
  editError,
  editTitle,
  swapError,
}: TodoAppProps) {
  return (
    <section id="todo-app" class="todo-app" aria-labelledby="todos-heading">
      <AddTodoForm error={formError} title={draftTitle} />
      <FilterBar filter={filter} stats={stats} />
      <Stats stats={stats} />

      <h2 id="todos-heading" class="section-heading">
        Todos
      </h2>

      {swapError ? (
        <p class="form-error swap-error" role="alert">
          {swapError}
        </p>
      ) : null}

      <TodoList
        todos={todos}
        filter={filter}
        page={page}
        editingId={editingId}
        editError={editError}
        editTitle={editTitle}
      />

      <Pagination filter={filter} page={page} pageCount={pageCount} />
    </section>
  )
}
