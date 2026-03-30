import { useState, useEffect, useCallback } from 'react'
import TaskCard from '../components/TaskCard'
import { getTasks } from '../lib/api'

const TABS = [
  { id: 'latest', label: 'Latest' },
  { id: 'top',    label: 'Top' },
  { id: 'hot',    label: 'Hot' },
]

const URGENCY_RANK = { critical: 3, urgent: 2, normal: 1 }

function sortTasks(tasks, tab) {
  const copy = [...tasks]
  if (tab === 'top') return copy.sort((a, b) => (b.reply_count ?? 0) - (a.reply_count ?? 0))
  if (tab === 'hot') return copy.sort((a, b) => (b.credits_offered ?? 0) - (a.credits_offered ?? 0))
  // latest (default)
  return copy.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
}

const BANNER_KEY = 'jp_banner_dismissed'

export default function TaskListPage() {
  const [tasks, setTasks]           = useState([])
  const [tab, setTab]               = useState('latest')
  const [loading, setLoading]       = useState(true)
  const [showBanner, setShowBanner] = useState(() => !localStorage.getItem(BANNER_KEY))

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getTasks('open')
      setTasks(data.tasks || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  function dismissBanner() {
    localStorage.setItem(BANNER_KEY, '1')
    setShowBanner(false)
  }

  const sorted = sortTasks(tasks, tab)

  return (
    <div className="forum-page">
      <div style={{ padding: '20px 20px 0' }}>
        {showBanner && (
          <div className="forum-banner">
            <div className="forum-banner-content">
              <h3>Welcome to Judgment Pool</h3>
              <p>Post tasks and get help from the community. Offer credits as a bounty to attract expert attention.</p>
            </div>
            <button className="forum-banner-close" onClick={dismissBanner}>✕</button>
          </div>
        )}

        <div className="forum-toolbar">
          <button className="forum-filter-btn">
            <span>⊞</span> Categories
          </button>
          <button className="forum-filter-btn">
            <span>#</span> Tags
          </button>
          <div className="forum-tab-group">
            {TABS.map(t => (
              <button
                key={t.id}
                className={`forum-tab${tab === t.id ? ' active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="forum-loading">Loading topics...</div>
      ) : sorted.length === 0 ? (
        <div className="forum-empty">No open tasks yet. Use the sidebar to post your first task!</div>
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
            {sorted.map(task => (
              <TaskCard key={task.id} task={task} />
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
