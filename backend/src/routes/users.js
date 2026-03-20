const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await db.getAsync(
      `SELECT id, name, email, credits, daily_task_count, daily_reset_at, created_at FROM users WHERE id = ?`,
      [req.user.id]);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const today = new Date().toISOString().slice(0, 10);
    const dailyCount = user.daily_reset_at === today ? user.daily_task_count : 0;
    const limit = parseInt(process.env.DAILY_TASK_LIMIT || '20');
    const stats = {
      tasks_requested: (await db.getAsync(`SELECT COUNT(*) as c FROM tasks WHERE requester_id=?`, [req.user.id])).c,
      tasks_completed: (await db.getAsync(`SELECT COUNT(*) as c FROM tasks WHERE assignee_id=? AND status='completed'`, [req.user.id])).c,
    };
    const attention_guard = {
      daily_tasks_done: dailyCount,
      daily_limit: limit,
      warning: dailyCount >= 15 ? '⚠️ 你今天已处理不少判断任务，注意保护注意力！' : null,
    };
    res.json({ user: { ...user, daily_task_count: dailyCount }, stats, attention_guard });
  } catch (e) { next(e); }
});

router.get('/me/ledger', auth, async (req, res, next) => {
  try {
    const ledger = await db.allAsync(
      `SELECT * FROM credit_ledger WHERE user_id=? ORDER BY created_at DESC LIMIT 50`, [req.user.id]);
    res.json({ ledger });
  } catch (e) { next(e); }
});

module.exports = router;
