#!/usr/bin/env node
/**
 * Fetch all messages for a task (conversation history).
 * Usage: node get_messages.js --task-id <id>
 */
const { parseArgs, api } = require('./_utils');
const args = parseArgs({ 'task-id': { required: true } });

(async () => {
  const { messages } = await api('GET', `/tasks/${args['task-id']}/messages`);
  console.log(JSON.stringify(messages.map(m => ({
    sender: m.sender_name,
    content: m.content,
    created_at: m.created_at,
  }))));
})().catch(e => { console.error(e.message); process.exit(1); });
