import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getUser, logout } from '../lib/auth'

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase()
}

const CATEGORIES = [
  { label: 'Bounty Tasks',  color: '#f59e0b', cls: 'cat-bounty' },
  { label: 'Urgent Help',   color: '#ef4444', cls: 'cat-urgent' },
  { label: 'Design Review', color: '#a78bfa', cls: 'cat-design' },
  { label: 'Code Review',   color: '#38bdf8', cls: 'cat-code' },
  { label: 'Discussion',    color: '#22c55e', cls: 'cat-default' },
]

const TAGS = ['react', 'backend', 'urgent', 'design', 'api']

export default function Sidebar({ onAskForHelp }) {
  const location = useLocation()
  const navigate = useNavigate()
  const user = getUser()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-header">
        <div className="sidebar-logo" onClick={() => navigate('/')}>
          <span className="sidebar-logo-icon">≡</span>
          <span className="sidebar-logo-text">JUDGMENT POOL</span>
        </div>
      </div>

      {/* Primary nav */}
      <nav className="sidebar-nav">
        <Link
          to="/"
          className={`sidebar-item ${location.pathname === '/' ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">◎</span>
          Topics
        </Link>
        <span className="sidebar-item">
          <span className="sidebar-item-icon">⋯</span>
          More
        </span>
      </nav>

      {/* Resources */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Resources</div>
        <Link
          to="/my-tasks"
          className={`sidebar-item ${location.pathname === '/my-tasks' ? 'active' : ''}`}
        >
          <span className="sidebar-item-icon">☑</span>
          My Tasks
        </Link>
        <a
          href="http://localhost:7473/api/tasks"
          target="_blank"
          rel="noopener noreferrer"
          className="sidebar-item"
        >
          <span className="sidebar-item-icon">⎇</span>
          API Reference
        </a>
      </div>

      {/* Categories */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Categories</div>
        {CATEGORIES.map(cat => (
          <span key={cat.label} className="sidebar-item">
            <span
              className={`sidebar-cat-dot ${cat.cls}`}
              style={{ background: cat.color }}
            />
            {cat.label}
          </span>
        ))}
      </div>

      {/* Tags */}
      <div className="sidebar-section">
        <div className="sidebar-section-title">Tags</div>
        {TAGS.map(tag => (
          <span key={tag} className="sidebar-item">
            <span className="sidebar-item-icon sidebar-tag-icon">#</span>
            {tag}
          </span>
        ))}
      </div>

      {/* Footer: user + actions */}
      <div className="sidebar-footer">
        {user && (
          <div className="sidebar-user-row">
            <div className="sidebar-avatar">{initials(user.name)}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-username">@{user.name}</div>
              <div className="sidebar-credits">© {user.credits} Credits</div>
            </div>
          </div>
        )}
        <button className="sidebar-ask-btn" onClick={onAskForHelp}>
          ASK FOR HELP
        </button>
        <button className="sidebar-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </aside>
  )
}
