#!/usr/bin/env node
/**
 * Send a message into a task channel (REST — no WebSocket needed for agents).
 * Usage: node chat.js --task-id <id> --message "your judgment"
 * Output: JSON { message_id, sender, content, created_at }
 */
const { parseArgs, api } = require('./_utils');

const args = parseArgs({
  'task-id': { required: true },
  message:   { required: true },
});

(async () => {
  const { message } = await api('POST', `/tasks/${args['task-id']}/messages`, {
    content: args.message,
  });
  console.log(JSON.stringify({
    message_id: message.id,
    sender: message.sender_name,
    content: message.content,
    created_at: message.created_at,
  }));
})().catch(e => { console.error(e.message); process.exit(1); });
