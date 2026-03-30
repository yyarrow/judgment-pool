import { useState, useRef } from 'react'
import { createTask, uploadFile } from '../lib/api'

const TASK_TYPES = [
  { id: 'poll', label: 'POLL', icon: '▦', disabled: true, desc: 'Quick vote' },
  { id: 'post', label: 'POST', icon: '✎', disabled: false, desc: 'Discussion' },
  { id: 'chat', label: 'CHAT', icon: '◯', disabled: true, desc: 'Private chat' },
]

const URGENCY_OPTIONS = [
  { value: 'normal',   label: 'Normal' },
  { value: 'urgent',   label: 'Urgent' },
  { value: 'critical', label: 'Critical' },
]

export default function PostTaskModal({ onClose, onCreated }) {
  const [selectedType, setSelectedType] = useState('post')
  const [form, setForm] = useState({
    title: '',
    description: '',
    tags: '',
    credits_offered: '',
    urgency: 'normal',
  })
  const [attachments, setAttachments] = useState([])
  const [uploading, setUploading]     = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const fileInputRef = useRef()

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    setUploading(true)
    setError('')
    try {
      const results = await Promise.all(files.map(f => uploadFile(f)))
      setAttachments(prev => [...prev, ...results.map(r => r.url)])
    } catch (err) {
      setError(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean)
      await createTask({
        type: selectedType,
        title: form.title,
        description: form.description,
        tags,
        credits_offered: form.credits_offered ? Number(form.credits_offered) : undefined,
        urgency: form.urgency,
        attachments,
      })
      onCreated?.()
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
    }
  }

  function insertFormat(tag) {
    const ta = document.getElementById('task-description')
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const selected = form.description.slice(s, e)
    let insert = ''
    if (tag === 'bold')   insert = `**${selected || 'text'}**`
    if (tag === 'italic') insert = `_${selected || 'text'}_`
    if (tag === 'code')   insert = `\`${selected || 'code'}\``
    if (tag === 'link')   insert = `[${selected || 'link'}](url)`
    const next = form.description.slice(0, s) + insert + form.description.slice(e)
    setForm(f => ({ ...f, description: next }))
    setTimeout(() => {
      ta.focus()
      ta.setSelectionRange(s + insert.length, s + insert.length)
    }, 0)
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <h3>Post a New Task</h3>

        {/* Step 1: Task Type */}
        <div className="modal-section">
          <p className="modal-step">Step 1 — Task Type</p>
          <div className="type-selector">
            {TASK_TYPES.map(t => (
              <button
                key={t.id}
                className={`type-btn${selectedType === t.id ? ' active' : ''}${t.disabled ? ' disabled' : ''}`}
                onClick={() => !t.disabled && setSelectedType(t.id)}
                title={t.disabled ? 'Coming Soon' : t.desc}
              >
                <span className="type-icon">{t.icon}</span>
                <span>{t.label}</span>
                {t.disabled && <span className="coming-soon">Soon</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Form */}
        <div className="modal-section">
          <p className="modal-step">Step 2 — Task Details</p>
          {error && <div className="error-msg" style={{ marginBottom: 12 }}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Post Title..."
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              required
              className="modal-input"
            />

            <div className="editor-toolbar">
              <button type="button" onClick={() => insertFormat('bold')}><b>B</b></button>
              <button type="button" onClick={() => insertFormat('italic')}><i>I</i></button>
              <button type="button" onClick={() => insertFormat('code')}>&lt;/&gt;</button>
              <button type="button" onClick={() => insertFormat('link')}>⎋</button>
            </div>
            <textarea
              id="task-description"
              placeholder="Describe the decision you need help with..."
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              required
              rows={5}
              className="modal-textarea"
            />

            <input
              type="text"
              placeholder="Tags (e.g., react, backend, urgent)"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="modal-input"
            />

            {/* Attachments */}
            <div className="attachment-area">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleFiles}
              />
              <button
                type="button"
                className="attach-btn"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? '⏳ Uploading...' : '⊕ Add Images'}
              </button>
              {attachments.length > 0 && (
                <div className="attachment-previews">
                  {attachments.map((url, i) => (
                    <div key={i} className="attachment-thumb">
                      <img src={url} alt={`attachment-${i}`} />
                      <button
                        type="button"
                        className="thumb-remove"
                        onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}
                      >✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-row">
              <input
                type="number"
                placeholder="Credits Amount"
                value={form.credits_offered}
                onChange={e => setForm(f => ({ ...f, credits_offered: e.target.value }))}
                min={1}
                className="modal-input"
              />
              <select
                value={form.urgency}
                onChange={e => setForm(f => ({ ...f, urgency: e.target.value }))}
                className="modal-select"
              >
                {URGENCY_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn-outline" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn-primary" disabled={loading || uploading}>
                {loading ? 'Submitting...' : 'Submit'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
