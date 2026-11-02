import { Hono } from 'hono'
import { getStats } from '../db/todos'
import { parseFilter } from '../lib/filter'
import { parsePage } from '../lib/pagination'
import { getTodoPage } from '../lib/todo-page'
import { Home } from '../views/Home'
import { Landing } from '../views/Landing'

const pages = new Hono()

pages.get('/', (c) => c.html(<Landing />))

pages.get('/app', (c) => {
  const filter = parseFilter(c.req.query('filter'))
  const requestedPage = parsePage(c.req.query('page'))
  const { todos, page, pageCount } = getTodoPage(filter, requestedPage)

  return c.html(
    <Home
      filter={filter}
      todos={todos}
      stats={getStats()}
      page={page}
      pageCount={pageCount}
    />,
  )
})

export default pages
