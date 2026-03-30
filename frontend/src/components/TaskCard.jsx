import { useNavigate } from 'react-router-dom'

export function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  if (days < 30) return `${days}d`
  return `${Math.floor(days / 30)}mo`
}

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase()
}

const URGENCY_COLOR = {
  normal:   null,
  urgent:   '#f97316',
  critical: '#ef4444',
}

function categoryClass(urgency, credits) {
  if (urgency === 'critical') return 'cat-urgent'
  if (urgency === 'urgent')   return 'cat-urgent'
  if (credits >= 100)         return 'cat-bounty'
  return 'cat-default'
}

function categoryLabel(urgency, credits) {
  if (urgency === 'critical') return 'Critical'
  if (urgency === 'urgent')   return 'Urgent'
  if (credits >= 100)         return 'Bounty'
  return 'Discussion'
}

export default function TaskCard({ task }) {
  const navigate = useNavigate()
  const urgencyColor = URGENCY_COLOR[task.urgency]
  const tags = Array.isArray(task.tags)
    ? task.tags
    : (task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [])

  const replies = task.reply_count ?? 0
  const views   = task.view_count  ?? 0
  const credits = task.credits_offered ?? 0

  return (
    <tr className="topic-row" onClick={() => navigate(`/tasks/${task.id}`)}>
      {/* Main topic cell */}
      <td className="topic-cell">
        <div className="topic-title-line">
          {urgencyColor && (
            <span
              className="topic-urgency-dot"
              style={{ background: urgencyColor }}
            />
          )}
          <span className="topic-title-text">{task.title}</span>
        </div>

        <div className="topic-meta-line">
          <span className={`topic-category-badge ${categoryClass(task.urgency, credits)}`}>
            {categoryLabel(task.urgency, credits)}
          </span>
          <span className="topic-excerpt">
            {task.description?.slice(0, 100)}
            {task.description?.length > 100 ? '…' : ''}
          </span>
        </div>

        <div className="topic-bottom-line">
          {tags.slice(0, 3).map(tag => (
            <span key={tag} className="topic-tag">{tag}</span>
          ))}
          {credits > 0 && (
            <span className="topic-credits-badge">© {credits}</span>
          )}
          <div className="topic-participant-avatars">
            <div className="topic-mini-avatar">{initials(task.requester_name)}</div>
            {task.assignee_name && (
              <div
                className="topic-mini-avatar"
                style={{ background: '#22c55e', color: '#0d1117' }}
              >
                {initials(task.assignee_name)}
              </div>
            )}
          </div>
        </div>
      </td>

      {/* Replies */}
      <td className={`topic-stat-cell${replies > 5 ? ' highlight' : ''}`}>
        {replies}
      </td>

      {/* Views */}
      <td className={`topic-stat-cell${views > 100 ? ' highlight' : ''}`}>
        {views}
      </td>

      {/* Activity */}
      <td className="topic-activity-cell">
        {timeAgo(task.created_at)}
      </td>
    </tr>
  )
}
