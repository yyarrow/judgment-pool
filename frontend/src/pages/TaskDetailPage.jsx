import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getTask, acceptTask, completeTask, cancelTask, getMessages, sendMessage } from '../lib/api'
import { getUser, getToken } from '../lib/auth'
import * as ws from '../lib/ws'

const URGENCY_COLOR = { normal: null, urgent: '#f97316', critical: '#ef4444' }

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function initials(name) {
  return (name || '?').slice(0, 2).toUpperCase()
}

function PostAvatar({ name, role }) {
  const cls = role === 'requester' ? 'requester' : role === 'assignee' ? 'assignee' : 'viewer'
  return (
    <div className={`post-avatar ${cls}`}>{initials(name)}</div>
  )
}

export default function TaskDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const currentUser = getUser()
  const bottomRef = useRef(null)

  const [task, setTask]               = useState(null)
  const [messages, setMessages]       = useState([])
  const [input, setInput]             = useState('')
  const [sending, setSending]         = useState(false)
  const [loading, setLoading]         = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [rating, setRating]           = useState(5)

  async function refresh() {
    try {
      const taskData = await getTask(id)
      setTask(taskData.task)
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [id])

  useEffect(() => {
    if (!id) return

    getMessages(id).then(data => {
      setMessages(data.messages || [])
    }).catch(() => {})

    const token = getToken()
    if (token) {
      ws.connect(id, token, (data) => {
        if (data.type === 'message' && data.message) {
          setMessages(prev => {
            if (prev.find(m => m.id === data.message.id)) return prev
            return [...prev, data.message]
          })
        }
      })
    }

    return () => ws.disconnect()
  }, [id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleAccept() {
    setActionLoading(true)
    try { await acceptTask(id); await refresh() } catch (e) { alert(e.message) }
    setActionLoading(false)
  }

  async function handleComplete() {
    setActionLoading(true)
    try { await completeTask(id, rating); await refresh() } catch (e) { alert(e.message) }
    setActionLoading(false)
  }

  async function handleCancel() {
    if (!confirm('Cancel this task and refund credits?')) return
    setActionLoading(true)
    try { await cancelTask(id); await refresh() } catch (e) { alert(e.message) }
    setActionLoading(false)
  }

  async function handleSend(e) {
    e.preventDefault()
    if (!input.trim() || sending) return
    setSending(true)
    try {
      await sendMessage(id, input.trim())
      setInput('')
    } catch {}
    setSending(false)
  }

  if (loading) return (
    <div className="loading">Loading thread...</div>
  )
  if (!task) return (
    <div className="empty">Task not found.</div>
  )

  const isRequester = task.requester_id === currentUser?.id
  const isAssignee  = task.assignee_id  === currentUser?.id
  const urgencyColor = URGENCY_COLOR[task.urgency]
  const tags = Array.isArray(task.tags)
    ? task.tags
    : (task.tags ? task.tags.split(',').map(t => t.trim()).filter(Boolean) : [])

  // POST type: anyone can send. CHAT type: only participants.
  const canSend = task.type === 'post' || isRequester || isAssignee

  const showActions = (
    (task.status === 'open' && !isRequester) ||
    (task.status === 'accepted' && (isAssignee || isRequester)) ||
    (task.status === 'open' && isRequester)
  )

  return (
    <div className="thread-page">
      <div className="thread-main">
        {/* Thread header */}
        <div className="thread-header">
          <button className="thread-back" onClick={() => navigate('/')}>
            ← Back to topics
          </button>
          <h1 className="thread-title">{task.title}</h1>
          {tags.length > 0 && (
            <div className="thread-tags">
              {tags.map(tag => (
                <span key={tag} className="thread-tag">{tag}</span>
              ))}
            </div>
          )}
        </div>

        {/* First post (OP) */}
        <div className="thread-post">
          <div className="post-avatar-col">
            <PostAvatar name={task.requester_name} role="requester" />
          </div>
          <div className="post-body">
            <div className="post-meta">
              <span className="post-author">@{task.requester_name}</span>
              <span className="post-role-badge role-requester">Author</span>
              <span
                className={`urgency-badge urgency-${task.urgency}`}
              >
                {task.urgency}
              </span>
              <span className={`status-badge status-${task.status}`}>{task.status}</span>
              <span className="post-time">{timeAgo(task.created_at)}</span>
            </div>
            <div className="post-content">{task.description}</div>

            {/* Metadata card inside OP */}
            <div className="op-info-card">
              <div className="op-info-row">
                <span className="op-info-label">Credits</span>
                <span className="op-credits-value">© {task.credits_offered}</span>
              </div>
              <div className="op-info-row">
                <span className="op-info-label">Type</span>
                <span className="op-info-value">{task.type}</span>
              </div>
              <div className="op-info-row">
                <span className="op-info-label">Status</span>
                <span className={`status-badge status-${task.status}`}>{task.status}</span>
              </div>
              {task.assignee_name && (
                <div className="op-info-row">
                  <span className="op-info-label">Assigned to</span>
                  <span className="op-info-value">@{task.assignee_name}</span>
                </div>
              )}
            </div>

            {/* Attachments */}
            {task.attachments?.length > 0 && (
              <div className="op-attachments">
                {task.attachments.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`attachment-${i}`}
                    className="op-attachment-img"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action bar */}
        {showActions && (
          <div className="thread-actions">
            <span className="thread-actions-label">Actions:</span>

            {task.status === 'open' && !isRequester && (
              <button className="btn-primary" onClick={handleAccept} disabled={actionLoading}>
                Accept Task
              </button>
            )}

            {task.status === 'accepted' && (isAssignee || isRequester) && (
              <div className="complete-row">
                <select
                  value={rating}
                  onChange={e => setRating(Number(e.target.value))}
                  className="rating-select"
                >
                  {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} ★</option>)}
                </select>
                <button className="btn-primary" onClick={handleComplete} disabled={actionLoading}>
                  {isRequester ? 'Mark Complete' : 'Complete Task'}
                </button>
              </div>
            )}

            {task.status === 'open' && isRequester && (
              <button className="btn-danger" onClick={handleCancel} disabled={actionLoading}>
                Close Task
              </button>
            )}
          </div>
        )}

        {/* Thread replies (messages) */}
        {messages.length > 0 && messages.map((msg, idx) => {
          const isMsgRequester = msg.sender_id === task.requester_id
          const isMsgAssignee  = msg.sender_id === task.assignee_id
          const role = isMsgRequester ? 'requester' : isMsgAssignee ? 'assignee' : 'viewer'

          return (
            <div key={msg.id} className="thread-post">
              <div className="post-avatar-col">
                <PostAvatar name={msg.sender_name} role={role} />
              </div>
              <div className="post-body">
                <div className="post-meta">
                  <span className="post-author">@{msg.sender_name}</span>
                  {isMsgRequester && (
                    <span className="post-role-badge role-requester">Author</span>
                  )}
                  {isMsgAssignee && (
                    <span className="post-role-badge role-assignee">Assignee</span>
                  )}
                  <span className="post-time">
                    #{idx + 1} &nbsp;·&nbsp; {timeAgo(msg.created_at)}
                  </span>
                </div>
                <div className="post-content">{msg.content}</div>
              </div>
            </div>
          )
        })}

        {messages.length === 0 && (
          <div style={{ padding: '32px 24px', color: 'var(--text-muted)', fontSize: 14 }}>
            No replies yet. Be the first to respond!
          </div>
        )}

        <div ref={bottomRef} />

        {/* Reply composer */}
        {canSend && (
          <div className="reply-input-area">
            <form onSubmit={handleSend}>
              <div className="reply-composer">
                <textarea
                  className="reply-textarea"
                  placeholder="Write a reply..."
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSend(e)
                  }}
                  rows={3}
                />
                <div className="reply-toolbar">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={sending || !input.trim()}
                  >
                    {sending ? 'Sending…' : 'Reply'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Timeline scrubber */}
      <div className="thread-timeline">
        <div className="timeline-track">
          <div className="timeline-thumb" />
        </div>
      </div>
    </div>
  )
}
