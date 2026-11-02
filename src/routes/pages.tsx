import { Hono } from 'hono'
import { getStats, listTodos } from '../db/todos'
import { parseFilter } from '../lib/filter'
import { Help } from '../views/Help'
import { Home } from '../views/Home'
import { Landing } from '../views/Landing'

const pages = new Hono()

pages.get('/', (c) => c.html(<Landing />))

pages.get('/app', (c) => {
  const filter = parseFilter(c.req.query('filter'))

  return c.html(
    <Home
      filter={filter}
      todos={listTodos(filter)}
      stats={getStats()}
    />,
  )
})

pages.get('/help', (c) => c.html(<Help />))

export default pages
