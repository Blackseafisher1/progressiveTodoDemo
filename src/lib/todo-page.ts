import { listTodos, type Todo } from '../db/todos'
import type { Filter } from './filter'
import { PAGE_SIZE } from './pagination'

export type TodoPage = {
  todos: Todo[]
  page: number
  pageCount: number
}

export function getTodoPage(filter: Filter, requestedPage: number): TodoPage {
  const all = listTodos(filter)
  const pageCount = Math.max(1, Math.ceil(all.length / PAGE_SIZE))
  const page = Math.min(Math.max(requestedPage, 1), pageCount)
  const start = (page - 1) * PAGE_SIZE

  return {
    todos: all.slice(start, start + PAGE_SIZE),
    page,
    pageCount,
  }
}
