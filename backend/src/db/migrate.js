const db = require('./index');

async function migrate() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      credits INTEGER DEFAULT 100,
      daily_task_count INTEGER DEFAULT 0,
      daily_reset_at TEXT DEFAULT (date('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      requester_id TEXT NOT NULL,
      assignee_id TEXT,
      status TEXT DEFAULT 'open',
      urgency TEXT DEFAULT 'normal',
      credits_offered INTEGER NOT NULL,
      rating INTEGER,
      created_at TEXT DEFAULT (datetime('now')),
      accepted_at TEXT,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      sender_id TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS credit_ledger (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      delta INTEGER NOT NULL,
      reason TEXT NOT NULL,
      task_id TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_requester ON tasks(requester_id);
    CREATE INDEX IF NOT EXISTS idx_messages_task ON messages(task_id);
    CREATE INDEX IF NOT EXISTS idx_ledger_user ON credit_ledger(user_id);
  `);
  console.log('✅ Database migrated:', process.env.DB_PATH || 'data/judgment_pool.db');
  db.close();
}

migrate().catch(e => { console.error(e); process.exit(1); });
