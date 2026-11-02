import { Hono, type Context } from 'hono'
import { TodoApp } from '../components/TodoApp'
import { TodoEditForm } from '../components/TodoEditForm'
import { TodoItem } from '../components/TodoItem'
import {
  createTodo,
  deleteTodo,
  getStats,
  getTodo,
  listTodos,
  renameTodo,
  swapTodoPositions,
  toggleTodo,
} from '../db/todos'
import { filterHref, parseFilter, type Filter } from '../lib/filter'
import { PAGE_SIZE, pageHref, parsePage } from '../lib/pagination'
import { getTodoPage } from '../lib/todo-page'
import { Home } from '../views/Home'

const todos = new Hono()

type PageOptions = {
  formError?: string
  draftTitle?: string
  editingId?: number
  editError?: string
  editTitle?: string
  swapError?: string
}

function isHtmx(c: Context): boolean {
  return c.req.header('HX-Request') === 'true'
}

function parseId(value: string | undefined): number | null {
  const id = Number(value)
  return Number.isInteger(id) && id > 0 ? id : null
}

function currentFilter(c: Context): Filter {
  const current = c.req.header('HX-Current-URL')
  if (!current) return 'all'

  try {
    return parseFilter(new URL(current).searchParams.get('filter'))
  } catch {
    return 'all'
  }
}

function currentPage(c: Context): number {
  const current = c.req.header('HX-Current-URL')
  if (!current) return 1

  try {
    return parsePage(new URL(current).searchParams.get('page'))
  } catch {
    return 1
  }
}

function filterFor(c: Context): Filter {
  return c.req.query('filter') === undefined
    ? currentFilter(c)
    : parseFilter(c.req.query('filter'))
}

function pageFor(c: Context): number {
  return c.req.query('page') === undefined
    ? currentPage(c)
    : parsePage(c.req.query('page'))
}

function todoLocation(
  filter: Filter,
  id: number,
): { page: number; hash: string } | null {
  const index = listTodos(filter).findIndex((todo) => todo.id === id)
  if (index === -1) return null

  return {
    page: Math.floor(index / PAGE_SIZE) + 1,
    hash: `#todo-${id}`,
  }
}

function pushAllIfNeeded(c: Context): void {
  const current = c.req.header('HX-Current-URL')
  if (!current) return

  try {
    const url = new URL(current)
    if (url.pathname !== '/app' || url.search !== '') {
      c.header('HX-Push-Url', '/app')
    }
  } catch {
    // Ignore malformed current URLs.
  }
}

function renderPanel(
  c: Context,
  filter: Filter,
  page: number,
  options: PageOptions = {},
  status: 200 | 422 = 200,
) {
  // With htmx available, load the whole filtered list at once.
  const data = isHtmx(c)
    ? { todos: listTodos(filter), page: 1, pageCount: 1 }
    : getTodoPage(filter, page)

  return c.html(
    <TodoApp
      filter={filter}
      todos={data.todos}
      stats={getStats()}
      page={data.page}
      pageCount={data.pageCount}
      formError={options.formError}
      draftTitle={options.draftTitle}
      editingId={options.editingId}
      editError={options.editError}
      editTitle={options.editTitle}
      swapError={options.swapError}
    />,
    status,
  )
}

function renderPage(
  c: Context,
  filter: Filter,
  page: number,
  options: PageOptions = {},
  status: 200 | 422 = 200,
) {
  const data = getTodoPage(filter, page)

  return c.html(
    <Home
      filter={filter}
      todos={data.todos}
      stats={getStats()}
      page={data.page}
      pageCount={data.pageCount}
      formError={options.formError}
      draftTitle={options.draftTitle}
      editingId={options.editingId}
      editError={options.editError}
      editTitle={options.editTitle}
      swapError={options.swapError}
    />,
    status,
  )
}

todos.get('/todos', (c) => {
  const filter = parseFilter(c.req.query('filter'))
  const page = parsePage(c.req.query('page'))

  if (!isHtmx(c)) {
    return c.redirect(pageHref(filter, getTodoPage(filter, page).page), 303)
  }

  if (c.req.query('all') === '1') {
    c.header('HX-Replace-Url', filterHref(filter))
  }

  return renderPanel(c, filter, page)
})

todos.post('/todos', async (c) => {
  const raw = (await c.req.parseBody()).title
  const title = typeof raw === 'string' ? raw.trim() : ''
  const draftTitle = typeof raw === 'string' ? raw : ''

  if (!title) {
    const options = {
      formError: 'Please enter a todo title.',
      draftTitle,
    }

    if (!isHtmx(c)) return renderPage(c, 'all', 1, options, 422)
    pushAllIfNeeded(c)
    return renderPanel(c, 'all', 1, options, 422)
  }

  const todo = createTodo(title)

  if (!isHtmx(c)) {
    const location = todoLocation('all', todo.id)
    return c.redirect(
      location
        ? `${pageHref('all', location.page)}${location.hash}`
        : '/app',
      303,
    )
  }

  pushAllIfNeeded(c)
  c.header('HX-Push-Url', `/app#todo-${todo.id}`)
  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Todo added', type: 'success' } }),
  )

  return renderPanel(c, 'all', 1)
})

todos.post('/todos/swap', async (c) => {
  const filter = filterFor(c)
  const page = pageFor(c)
  const body = await c.req.parseBody()
  const firstToken = typeof body.a === 'string' ? body.a.trim() : ''
  const secondToken = typeof body.b === 'string' ? body.b.trim() : ''
  const items = listTodos(filter)

  const resolve = (token: string) => {
    if (!token) return null

    const byTitle = items.find(
      (todo) => todo.title.toLowerCase() === token.toLowerCase(),
    )
    if (byTitle) return byTitle

    if (/^\d+$/.test(token)) {
      const index = Number(token)
      return index >= 1 && index <= items.length ? items[index - 1] : null
    }

    return null
  }

  const first = resolve(firstToken)
  const second = resolve(secondToken)

  if (!first || !second || first.id === second.id) {
    const error =
      'Use two different todo titles or 1-based numbers from this filter.'

    if (!isHtmx(c)) return renderPage(c, filter, page, { swapError: error }, 422)
    return renderPanel(c, filter, page, { swapError: error }, 422)
  }

  swapTodoPositions(first.id, second.id)

  const location = todoLocation(filter, first.id)

  if (!isHtmx(c)) {
    return c.redirect(
      location
        ? `${pageHref(filter, location.page)}${location.hash}`
        : pageHref(filter, page),
      303,
    )
  }

  c.header(
    'HX-Push-Url',
    location ? `${filterHref(filter)}${location.hash}` : filterHref(filter),
  )
  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Order swapped', type: 'success' } }),
  )

  return renderPanel(c, filter, 1)
})

todos.post('/todos/:id/toggle', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const page = pageFor(c)
  const todo = toggleTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    const location = todoLocation(filter, id)
    return c.redirect(
      location
        ? `${pageHref(filter, location.page)}${location.hash}`
        : pageHref(filter, getTodoPage(filter, page).page),
      303,
    )
  }

  return renderPanel(c, filter, page)
})

todos.get('/todos/:id/edit', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const page = pageFor(c)
  const todo = getTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) return renderPage(c, filter, page, { editingId: id })
  return c.html(<TodoEditForm todo={todo} filter={filter} page={page} />)
})

todos.post('/todos/:id/update', async (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const page = pageFor(c)
  const todo = getTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  const raw = (await c.req.parseBody()).title
  const title = typeof raw === 'string' ? raw.trim() : ''
  const draftTitle = typeof raw === 'string' ? raw : todo.title

  if (!title) {
    if (!isHtmx(c)) {
      return renderPage(
        c,
        filter,
        page,
        {
          editingId: id,
          editError: 'Please enter a todo title.',
          editTitle: draftTitle,
        },
        422,
      )
    }

    return c.html(
      <TodoEditForm
        todo={todo}
        filter={filter}
        page={page}
        title={draftTitle}
        error="Please enter a todo title."
      />,
      422,
    )
  }

  const updated = renameTodo(id, title)
  if (!updated) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    const location = todoLocation(filter, id)
    return c.redirect(
      location
        ? `${pageHref(filter, location.page)}${location.hash}`
        : pageHref(filter, getTodoPage(filter, page).page),
      303,
    )
  }

  const index = listTodos(filter).findIndex((item) => item.id === id) + 1

  return c.html(
    <TodoItem
      todo={updated}
      filter={filter}
      page={page}
      index={index}
      showDrag={filter === 'all'}
    />,
  )
})

todos.get('/todos/:id', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const page = pageFor(c)
  const todo = getTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    const location = todoLocation(filter, id)
    return c.redirect(
      location
        ? `${pageHref(filter, location.page)}${location.hash}`
        : pageHref(filter, getTodoPage(filter, page).page),
      303,
    )
  }

  const index = listTodos(filter).findIndex((item) => item.id === id) + 1

  return c.html(
    <TodoItem
      todo={todo}
      filter={filter}
      page={page}
      index={index}
      showDrag={filter === 'all'}
    />,
  )
})

todos.post('/todos/:id/delete', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const page = pageFor(c)
  if (!deleteTodo(id)) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    return c.redirect(pageHref(filter, getTodoPage(filter, page).page), 303)
  }

  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Todo deleted', type: 'success' } }),
  )

  return renderPanel(c, filter, page)
})

export default todos
