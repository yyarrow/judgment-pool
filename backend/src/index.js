require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const server = http.createServer(app);

// ── WebSocket Server ──────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });
const channels = new Map(); // taskId → Set<WebSocket>

function wsBroadcast(taskId, payload) {
  const room = channels.get(taskId);
  if (!room) return;
  const data = JSON.stringify(payload);
  for (const client of room) {
    if (client.readyState === WebSocket.OPEN) client.send(data);
  }
}

app.locals.wsBroadcast = wsBroadcast;

wss.on('connection', (ws, req) => {
  // Expect ?token=JWT&taskId=UUID in query string
  const url = new URL(req.url, 'http://localhost');
  const token = url.searchParams.get('token');
  const taskId = url.searchParams.get('taskId');

  if (!token || !taskId) { ws.close(1008, 'Missing token or taskId'); return; }

  let user;
  try {
    user = jwt.verify(token, process.env.JWT_SECRET || 'change-this-secret-in-production');
  } catch { ws.close(1008, 'Invalid token'); return; }

  // Check participant
  const task = db.prepare(`SELECT * FROM tasks WHERE id = ?`).get(taskId);
  if (!task || (task.requester_id !== user.id && task.assignee_id !== user.id)) {
    ws.close(1008, 'Not a participant'); return;
  }

  if (!channels.has(taskId)) channels.set(taskId, new Set());
  channels.get(taskId).add(ws);

  ws.on('message', (raw) => {
    let data;
    try { data = JSON.parse(raw); } catch { return; }
    if (data.type !== 'message' || !data.content) return;

    const id = uuidv4();
    db.prepare(`INSERT INTO messages (id, task_id, sender_id, content) VALUES (?,?,?,?)`)
      .run(id, taskId, user.id, data.content);

    const msg = db.prepare(`SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = ?`).get(id);
    wsBroadcast(taskId, { type: 'message', message: msg });
  });

  ws.on('close', () => {
    channels.get(taskId)?.delete(ws);
    if (channels.get(taskId)?.size === 0) channels.delete(taskId);
  });
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/tasks', require('./routes/tasks'));
app.use('/api/users', require('./routes/users'));

app.get('/api/health', (_, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🧠 Judgment Pool API running on port ${PORT}`));
