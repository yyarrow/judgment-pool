const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/users/me — current user profile + stats
router.get('/me', auth, (req, res) => {
  const user = db.prepare(`SELECT id, name, email, credits, daily_task_count, daily_reset_at, created_at FROM users WHERE id = ?`).get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  const today = new Date().toISOString().slice(0, 10);
  const dailyCount = user.daily_reset_at === today ? user.daily_task_count : 0;

  const stats = {
    tasks_requested: db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE requester_id = ?`).get(req.user.id).c,
    tasks_completed: db.prepare(`SELECT COUNT(*) as c FROM tasks WHERE assignee_id = ? AND status = 'completed'`).get(req.user.id).c,
    avg_rating_given: db.prepare(`SELECT AVG(rating) as r FROM tasks WHERE requester_id = ? AND rating IS NOT NULL`).get(req.user.id).r,
  };

  const attention_guard = {
    daily_tasks_done: dailyCount,
    daily_limit: parseInt(process.env.DAILY_TASK_LIMIT || '20'),
    warning: dailyCount >= 15 ? '⚠️ 你今天已处理不少判断任务，注意保护注意力！' : null,
  };

  res.json({ user: { ...user, daily_task_count: dailyCount }, stats, attention_guard });
});

// GET /api/users/me/ledger — credits history
router.get('/me/ledger', auth, (req, res) => {
  const ledger = db.prepare(`
    SELECT * FROM credit_ledger WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json({ ledger });
});

module.exports = router;
