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

function filterFor(c: Context): Filter {
  return c.req.query('filter') === undefined
    ? currentFilter(c)
    : parseFilter(c.req.query('filter'))
}

function todoHash(filter: Filter, id: number): string {
  return listTodos(filter).some((todo) => todo.id === id)
    ? `#todo-${id}`
    : ''
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
  options: PageOptions = {},
  status: 200 | 422 = 200,
) {
  return c.html(
    <TodoApp
      filter={filter}
      todos={listTodos(filter)}
      stats={getStats()}
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
  options: PageOptions = {},
  status: 200 | 422 = 200,
) {
  return c.html(
    <Home
      filter={filter}
      todos={listTodos(filter)}
      stats={getStats()}
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

  if (!isHtmx(c)) return c.redirect(filterHref(filter), 303)
  return renderPanel(c, filter)
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

    if (!isHtmx(c)) return renderPage(c, 'all', options, 422)
    pushAllIfNeeded(c)
    return renderPanel(c, 'all', options, 422)
  }

  const todo = createTodo(title)

  if (!isHtmx(c)) {
    return c.redirect(`${filterHref('all')}#todo-${todo.id}`, 303)
  }

  pushAllIfNeeded(c)
  c.header('HX-Push-Url', `/app#todo-${todo.id}`)
  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Todo added', type: 'success' } }),
  )

  return renderPanel(c, 'all')
})

todos.post('/todos/swap', async (c) => {
  const filter = filterFor(c)
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

    if (!isHtmx(c)) return renderPage(c, filter, { swapError: error }, 422)
    return renderPanel(c, filter, { swapError: error }, 422)
  }

  swapTodoPositions(first.id, second.id)

  const hash = todoHash(filter, first.id)

  if (!isHtmx(c)) {
    return c.redirect(`${filterHref(filter)}${hash}`, 303)
  }

  c.header('HX-Push-Url', `${filterHref(filter)}${hash}`)
  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Order swapped', type: 'success' } }),
  )

  return renderPanel(c, filter)
})

todos.post('/todos/:id/toggle', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const todo = toggleTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    return c.redirect(`${filterHref(filter)}${todoHash(filter, id)}`, 303)
  }

  return renderPanel(c, filter)
})

todos.get('/todos/:id/edit', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const todo = getTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) return renderPage(c, filter, { editingId: id })
  return c.html(<TodoEditForm todo={todo} filter={filter} />)
})

todos.post('/todos/:id/update', async (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
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
        title={draftTitle}
        error="Please enter a todo title."
      />,
      422,
    )
  }

  const updated = renameTodo(id, title)
  if (!updated) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    return c.redirect(`${filterHref(filter)}${todoHash(filter, id)}`, 303)
  }

  const index = listTodos(filter).findIndex((item) => item.id === id) + 1

  return c.html(
    <TodoItem
      todo={updated}
      filter={filter}
      index={index}
      showDrag={filter === 'all'}
    />,
  )
})

todos.get('/todos/:id', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  const todo = getTodo(id)
  if (!todo) return c.text('Todo not found', 404)

  if (!isHtmx(c)) {
    return c.redirect(`${filterHref(filter)}${todoHash(filter, id)}`, 303)
  }

  const index = listTodos(filter).findIndex((item) => item.id === id) + 1

  return c.html(
    <TodoItem
      todo={todo}
      filter={filter}
      index={index}
      showDrag={filter === 'all'}
    />,
  )
})

todos.post('/todos/:id/delete', (c) => {
  const id = parseId(c.req.param('id'))
  if (id === null) return c.text('Invalid todo id', 400)

  const filter = filterFor(c)
  if (!deleteTodo(id)) return c.text('Todo not found', 404)

  if (!isHtmx(c)) return c.redirect(filterHref(filter), 303)

  c.header(
    'HX-Trigger',
    JSON.stringify({ toast: { message: 'Todo deleted', type: 'success' } }),
  )

  return renderPanel(c, filter)
})

export default todos
