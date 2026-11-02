import type { TodoStats } from '../db/todos'

type Props = {
  stats: TodoStats
}

export function Stats({ stats }: Props) {
  return (
    <section class="stats" aria-label="Todo stats" aria-live="polite">
      <div class="stat">
        <span class="stat-value">{stats.total}</span>
        <span class="stat-label">Total</span>
      </div>
      <div class="stat">
        <span class="stat-value">{stats.active}</span>
        <span class="stat-label">Active</span>
      </div>
      <div class="stat">
        <span class="stat-value">{stats.done}</span>
        <span class="stat-label">Done</span>
      </div>
    </section>
  )
}
