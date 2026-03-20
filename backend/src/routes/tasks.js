const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const URGENCY_MULTIPLIER = { normal: 1, urgent: 2, critical: 3 };
const DAILY_LIMIT = parseInt(process.env.DAILY_TASK_LIMIT || '20');

// GET /api/tasks — list open tasks (excludes requester's own tasks)
router.get('/', auth, (req, res) => {
  const { status = 'open', limit = 20, offset = 0 } = req.query;
  const tasks = db.prepare(`
    SELECT t.*, u.name as requester_name
    FROM tasks t
    JOIN users u ON t.requester_id = u.id
    WHERE t.status = ? AND t.requester_id != ?
    ORDER BY t.created_at DESC
    LIMIT ? OFFSET ?
  `).all(status, req.user.id, Number(limit), Number(offset));
  res.json({ tasks });
});

// POST /api/tasks — create a task
router.post('/', auth, (req, res) => {
  const { title, description, urgency = 'normal', credits_offered } = req.body;
  if (!title || !description) return res.status(400).json({ error: 'title and description required' });

  const multiplier = URGENCY_MULTIPLIER[urgency] || 1;
  const credits = credits_offered
    ? Math.round(Number(credits_offered) * multiplier)
    : Math.round(10 * multiplier);

  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  if (user.credits < credits) return res.status(402).json({ error: 'Insufficient credits' });

  const id = uuidv4();
  const task = db.transaction(() => {
    db.prepare(`INSERT INTO tasks (id, title, description, requester_id, urgency, credits_offered) VALUES (?,?,?,?,?,?)`)
      .run(id, title, description, req.user.id, urgency, credits);
    // Escrow credits
    db.prepare(`UPDATE users SET credits = credits - ? WHERE id = ?`).run(credits, req.user.id);
    db.prepare(`INSERT INTO credit_ledger (id, user_id, delta, reason, task_id) VALUES (?,?,?,?,?)`)
      .run(uuidv4(), req.user.id, -credits, 'task_escrow', id);
    return db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(id);
  })();

  res.status(201).json({ task });
});

// GET /api/tasks/:id
router.get('/:id', auth, (req, res) => {
  const task = db.prepare(`
    SELECT t.*, u.name as requester_name, a.name as assignee_name
    FROM tasks t
    JOIN users u ON t.requester_id = u.id
    LEFT JOIN users a ON t.assignee_id = a.id
    WHERE t.id = ?
  `).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  res.json({ task });
});

// POST /api/tasks/:id/accept — take a task
router.post('/:id/accept', auth, (req, res) => {
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.status !== 'open') return res.status(409).json({ error: 'Task is not open' });
  if (task.requester_id === req.user.id) return res.status(403).json({ error: 'Cannot accept your own task' });

  // Daily limit check
  const user = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user.id);
  const today = new Date().toISOString().slice(0, 10);
  const count = user.daily_reset_at === today ? user.daily_task_count : 0;
  if (count >= DAILY_LIMIT) return res.status(429).json({ error: `Daily task limit (${DAILY_LIMIT}) reached. Rest your mind! 🧠` });

  db.transaction(() => {
    db.prepare(`UPDATE tasks SET status='accepted', assignee_id=?, accepted_at=datetime('now') WHERE id=?`)
      .run(req.user.id, task.id);
    db.prepare(`UPDATE users SET daily_task_count=?, daily_reset_at=? WHERE id=?`)
      .run(count + 1, today, req.user.id);
  })();

  res.json({ message: 'Task accepted', task_id: task.id });
});

// POST /api/tasks/:id/complete — mark done + pay out
router.post('/:id/complete', auth, (req, res) => {
  const { rating } = req.body; // 1-5
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.requester_id !== req.user.id) return res.status(403).json({ error: 'Only requester can complete' });
  if (task.status !== 'accepted') return res.status(409).json({ error: 'Task is not accepted yet' });
  if (!task.assignee_id) return res.status(409).json({ error: 'No assignee' });

  db.transaction(() => {
    db.prepare(`UPDATE tasks SET status='completed', rating=?, completed_at=datetime('now') WHERE id=?`)
      .run(rating || null, task.id);
    // Pay assignee
    db.prepare(`UPDATE users SET credits = credits + ? WHERE id = ?`).run(task.credits_offered, task.assignee_id);
    db.prepare(`INSERT INTO credit_ledger (id, user_id, delta, reason, task_id) VALUES (?,?,?,?,?)`)
      .run(uuidv4(), task.assignee_id, task.credits_offered, 'task_reward', task.id);
  })();

  res.json({ message: 'Task completed', credits_paid: task.credits_offered });
});

// POST /api/tasks/:id/cancel — refund if no assignee yet
router.post('/:id/cancel', auth, (req, res) => {
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.requester_id !== req.user.id) return res.status(403).json({ error: 'Only requester can cancel' });
  if (!['open'].includes(task.status)) return res.status(409).json({ error: 'Can only cancel open tasks' });

  db.transaction(() => {
    db.prepare(`UPDATE tasks SET status='cancelled' WHERE id=?`).run(task.id);
    // Refund escrow
    db.prepare(`UPDATE users SET credits = credits + ? WHERE id = ?`).run(task.credits_offered, req.user.id);
    db.prepare(`INSERT INTO credit_ledger (id, user_id, delta, reason, task_id) VALUES (?,?,?,?,?)`)
      .run(uuidv4(), req.user.id, task.credits_offered, 'task_refund', task.id);
  })();

  res.json({ message: 'Task cancelled, credits refunded' });
});

// GET /api/tasks/:id/messages
router.get('/:id/messages', auth, (req, res) => {
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.requester_id !== req.user.id && task.assignee_id !== req.user.id)
    return res.status(403).json({ error: 'Not a participant' });

  const messages = db.prepare(`
    SELECT m.*, u.name as sender_name FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.task_id = ? ORDER BY m.created_at ASC
  `).all(req.params.id);
  res.json({ messages });
});

// POST /api/tasks/:id/messages — send a message (REST fallback)
router.post('/:id/messages', auth, (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'content required' });

  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(req.params.id);
  if (!task) return res.status(404).json({ error: 'Task not found' });
  if (task.requester_id !== req.user.id && task.assignee_id !== req.user.id)
    return res.status(403).json({ error: 'Not a participant' });

  const id = uuidv4();
  db.prepare(`INSERT INTO messages (id, task_id, sender_id, content) VALUES (?,?,?,?)`)
    .run(id, task.id, req.user.id, content);

  const msg = db.prepare(`SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`).get(id);
  
  // Broadcast via WebSocket if available
  if (req.app.locals.wsBroadcast) {
    req.app.locals.wsBroadcast(task.id, { type: 'message', message: msg });
  }

  res.status(201).json({ message: msg });
});

module.exports = router;
