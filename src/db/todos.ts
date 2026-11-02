import { Database } from 'bun:sqlite'
import { join } from 'node:path'
import type { Filter } from '../lib/filter'

const dbPath =
  Bun.env.DB_PATH?.trim() || join(import.meta.dir, '..', '..', 'todo.sqlite')

const db = new Database(dbPath, { create: true })

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 5000;

  CREATE TABLE IF NOT EXISTS todos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    done INTEGER NOT NULL DEFAULT 0,
    position INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_todos_position ON todos(position);
`)

type TodoRow = {
  id: number
  title: string
  done: number
  position: number
  created_at: string
}

export type Todo = {
  id: number
  title: string
  done: boolean
  position: number
  createdAt: string
}

export type TodoStats = {
  total: number
  active: number
  done: number
}

function toTodo(row: TodoRow): Todo {
  return {
    id: row.id,
    title: row.title,
    done: row.done === 1,
    position: row.position,
    createdAt: row.created_at,
  }
}

const SELECT_TODO = 'SELECT id, title, done, position, created_at FROM todos'

export function listTodos(filter: Filter): Todo[] {
  const where =
    filter === 'active' ? 'WHERE done = 0' : filter === 'done' ? 'WHERE done = 1' : ''

  return db
    .query<TodoRow, []>(
      `${SELECT_TODO} ${where} ORDER BY position ASC, id ASC`,
    )
    .all()
    .map(toTodo)
}

export function getTodo(id: number): Todo | null {
  const row = db
    .query<TodoRow, [number]>(`${SELECT_TODO} WHERE id = ?`)
    .get(id)

  return row ? toTodo(row) : null
}

export function createTodo(title: string): Todo {
  const result = db.run(
    'INSERT INTO todos (title, position) VALUES (?, (SELECT COALESCE(MAX(position), -1) + 1 FROM todos))',
    [title],
  )

  const todo = getTodo(Number(result.lastInsertRowid))
  if (!todo) throw new Error('Could not create todo')
  return todo
}

export function toggleTodo(id: number): Todo | null {
  db.run('UPDATE todos SET done = CASE done WHEN 0 THEN 1 ELSE 0 END WHERE id = ?', [id])
  return getTodo(id)
}

export function renameTodo(id: number, title: string): Todo | null {
  db.run('UPDATE todos SET title = ? WHERE id = ?', [title, id])
  return getTodo(id)
}

export function deleteTodo(id: number): boolean {
  return db.run('DELETE FROM todos WHERE id = ?', [id]).changes > 0
}

export function getStats(): TodoStats {
  const row = db
    .query<TodoStats, []>(
      `SELECT
         COUNT(*) AS total,
         COALESCE(SUM(done = 0), 0) AS active,
         COALESCE(SUM(done = 1), 0) AS done
       FROM todos`,
    )
    .get()

  return row ?? { total: 0, active: 0, done: 0 }
}

export function swapTodoPositions(firstId: number, secondId: number): boolean {
  if (firstId === secondId) return false

  const first = getTodo(firstId)
  const second = getTodo(secondId)
  if (!first || !second) return false

  const setPosition = db.prepare('UPDATE todos SET position = ? WHERE id = ?')

  db.transaction(() => {
    setPosition.run(second.position, first.id)
    setPosition.run(first.position, second.id)
  })()

  return true
}

export function seedTodos(): void {
  const insert = db.prepare(
    'INSERT INTO todos (title, done, position) VALUES (?, ?, ?)',
  )

  const seeds: Array<[string, boolean]> = [
    ['Drag this row with the handle', false],
    ['Use the arrow keys while the handle is focused', false],
    ['Edit a todo inline', false],
    ['This one is already done', true],
    ['Swap two todos with the form', false],
    ['All todos are on one page', false],
    ['Anchor links restore your place', false],
    ['The order is stored on the server', false],
  ]

  db.transaction(() => {
    db.run('DELETE FROM todos')
    db.run("DELETE FROM sqlite_sequence WHERE name = 'todos'")
    seeds.forEach(([title, done], index) => {
      insert.run(title, done ? 1 : 0, index)
    })
  })()
}
