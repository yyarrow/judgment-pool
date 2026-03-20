const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const auth = require('../middleware/auth');

const URGENCY_MULTIPLIER = { normal: 1, urgent: 2, critical: 3 };
const DAILY_LIMIT = parseInt(process.env.DAILY_TASK_LIMIT || '20');

router.get('/', auth, async (req, res, next) => {
  try {
    const { status = 'open', limit = 20, offset = 0 } = req.query;
    const tasks = await db.allAsync(`
      SELECT t.*, u.name as requester_name FROM tasks t
      JOIN users u ON t.requester_id = u.id
      WHERE t.status = ? AND t.requester_id != ?
      ORDER BY t.created_at DESC LIMIT ? OFFSET ?
    `, [status, req.user.id, Number(limit), Number(offset)]);
    res.json({ tasks });
  } catch (e) { next(e); }
});

router.post('/', auth, async (req, res, next) => {
  try {
    const { title, description, urgency = 'normal', credits_offered } = req.body;
    if (!title || !description) return res.status(400).json({ error: 'title and description required' });
    const multiplier = URGENCY_MULTIPLIER[urgency] || 1;
    const credits = credits_offered ? Math.round(Number(credits_offered) * multiplier) : Math.round(10 * multiplier);
    const user = await db.getAsync(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    if (user.credits < credits) return res.status(402).json({ error: 'Insufficient credits' });
    const id = uuidv4();
    await db.runAsync(`INSERT INTO tasks (id,title,description,requester_id,urgency,credits_offered) VALUES (?,?,?,?,?,?)`,
      [id, title, description, req.user.id, urgency, credits]);
    await db.runAsync(`UPDATE users SET credits = credits - ? WHERE id = ?`, [credits, req.user.id]);
    await db.runAsync(`INSERT INTO credit_ledger (id,user_id,delta,reason,task_id) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.user.id, -credits, 'task_escrow', id]);
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [id]);
    res.status(201).json({ task });
  } catch (e) { next(e); }
});

router.get('/:id', auth, async (req, res, next) => {
  try {
    const task = await db.getAsync(`
      SELECT t.*, u.name as requester_name, a.name as assignee_name FROM tasks t
      JOIN users u ON t.requester_id = u.id
      LEFT JOIN users a ON t.assignee_id = a.id
      WHERE t.id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json({ task });
  } catch (e) { next(e); }
});

router.post('/:id/accept', auth, async (req, res, next) => {
  try {
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.status !== 'open') return res.status(409).json({ error: 'Task is not open' });
    if (task.requester_id === req.user.id) return res.status(403).json({ error: 'Cannot accept your own task' });
    const user = await db.getAsync(`SELECT * FROM users WHERE id = ?`, [req.user.id]);
    const today = new Date().toISOString().slice(0, 10);
    const count = user.daily_reset_at === today ? user.daily_task_count : 0;
    if (count >= DAILY_LIMIT)
      return res.status(429).json({ error: `Daily task limit (${DAILY_LIMIT}) reached. Rest your mind! 🧠` });
    await db.runAsync(`UPDATE tasks SET status='accepted', assignee_id=?, accepted_at=datetime('now') WHERE id=?`,
      [req.user.id, task.id]);
    await db.runAsync(`UPDATE users SET daily_task_count=?, daily_reset_at=? WHERE id=?`,
      [count + 1, today, req.user.id]);
    res.json({ message: 'Task accepted', task_id: task.id });
  } catch (e) { next(e); }
});

router.post('/:id/complete', auth, async (req, res, next) => {
  try {
    const { rating } = req.body;
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ error: 'Only requester can complete' });
    if (task.status !== 'accepted') return res.status(409).json({ error: 'Task is not accepted yet' });
    await db.runAsync(`UPDATE tasks SET status='completed', rating=?, completed_at=datetime('now') WHERE id=?`,
      [rating || null, task.id]);
    await db.runAsync(`UPDATE users SET credits = credits + ? WHERE id = ?`, [task.credits_offered, task.assignee_id]);
    await db.runAsync(`INSERT INTO credit_ledger (id,user_id,delta,reason,task_id) VALUES (?,?,?,?,?)`,
      [uuidv4(), task.assignee_id, task.credits_offered, 'task_reward', task.id]);
    res.json({ message: 'Task completed', credits_paid: task.credits_offered });
  } catch (e) { next(e); }
});

router.post('/:id/cancel', auth, async (req, res, next) => {
  try {
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.requester_id !== req.user.id) return res.status(403).json({ error: 'Only requester can cancel' });
    if (task.status !== 'open') return res.status(409).json({ error: 'Can only cancel open tasks' });
    await db.runAsync(`UPDATE tasks SET status='cancelled' WHERE id=?`, [task.id]);
    await db.runAsync(`UPDATE users SET credits = credits + ? WHERE id = ?`, [task.credits_offered, req.user.id]);
    await db.runAsync(`INSERT INTO credit_ledger (id,user_id,delta,reason,task_id) VALUES (?,?,?,?,?)`,
      [uuidv4(), req.user.id, task.credits_offered, 'task_refund', task.id]);
    res.json({ message: 'Task cancelled, credits refunded' });
  } catch (e) { next(e); }
});

router.get('/:id/messages', auth, async (req, res, next) => {
  try {
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.requester_id !== req.user.id && task.assignee_id !== req.user.id)
      return res.status(403).json({ error: 'Not a participant' });
    const messages = await db.allAsync(`
      SELECT m.*, u.name as sender_name FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.task_id = ? ORDER BY m.created_at ASC`, [req.params.id]);
    res.json({ messages });
  } catch (e) { next(e); }
});

router.post('/:id/messages', auth, async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ error: 'content required' });
    const task = await db.getAsync(`SELECT * FROM tasks WHERE id = ?`, [req.params.id]);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    if (task.requester_id !== req.user.id && task.assignee_id !== req.user.id)
      return res.status(403).json({ error: 'Not a participant' });
    const id = uuidv4();
    await db.runAsync(`INSERT INTO messages (id,task_id,sender_id,content) VALUES (?,?,?,?)`,
      [id, task.id, req.user.id, content]);
    const msg = await db.getAsync(
      `SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id=u.id WHERE m.id=?`, [id]);
    if (req.app.locals.wsBroadcast) req.app.locals.wsBroadcast(task.id, { type: 'message', message: msg });
    res.status(201).json({ message: msg });
  } catch (e) { next(e); }
});

module.exports = router;
