import { useState, useEffect, useCallback } from 'react'
import TaskCard from '../components/TaskCard'
import { getMyTasks } from '../lib/api'

const TABS = [
  { id: '',           label: 'All' },
  { id: 'open',       label: 'Open' },
  { id: 'accepted',   label: 'Accepted' },
  { id: 'completed',  label: 'Completed' },
  { id: 'cancelled',  label: 'Cancelled' },
]

export default function MyTasksPage() {
  const [tasks, setTasks]     = useState([])
  const [tab, setTab]         = useState('')
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getMyTasks(tab || undefined)
      setTasks(data.tasks || [])
    } catch {}
    setLoading(false)
  }, [tab])

  useEffect(() => { fetchAll() }, [fetchAll])

  return (
    <div className="my-tasks-page">
      <h1 className="my-tasks-title">My Tasks</h1>

      <div className="my-tasks-tabs">
        {TABS.map(t => (
          <button
            key={t.id}
            className={`my-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="loading">Loading your tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty">
          No tasks here yet. Use "ASK FOR HELP" in the sidebar to post your first task.
        </div>
      ) : (
        <table className="topic-table">
          <thead>
            <tr>
              <th>Topic</th>
              <th className="stat-th">Replies</th>
              <th className="stat-th">Views</th>
              <th className="activity-th">Activity</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
