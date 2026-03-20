#!/usr/bin/env node
/**
 * Poll until a task gets at least one reply message, then print it.
 * Usage: node poll_answer.js --task-id <id> [--timeout 300] [--interval 10]
 * Output: JSON { message, sender, created_at } or { timeout: true }
 */
const { parseArgs, api } = require('./_utils');

const args = parseArgs({
  'task-id':  { required: true },
  timeout:    { default: '300' },   // seconds
  interval:   { default: '10' },    // seconds between polls
});

(async () => {
  const taskId  = args['task-id'];
  const maxMs   = Number(args.timeout) * 1000;
  const waitMs  = Number(args.interval) * 1000;
  const start   = Date.now();

  // First check task exists and we're a participant
  const { task } = await api('GET', `/tasks/${taskId}`);
  process.stderr.write(`⏳ Waiting for judgment on: "${task.title}"\n`);

  while (Date.now() - start < maxMs) {
    const { messages } = await api('GET', `/tasks/${taskId}/messages`);
    // Return first message not from requester (i.e., the judgment)
    const answer = messages.find(m => m.sender_id !== task.requester_id);
    if (answer) {
      console.log(JSON.stringify({
        message: answer.content,
        sender: answer.sender_name,
        created_at: answer.created_at,
        task_id: taskId,
      }));
      return;
    }
    await new Promise(r => setTimeout(r, waitMs));
  }

  console.log(JSON.stringify({ timeout: true, task_id: taskId }));
})().catch(e => { console.error(e.message); process.exit(1); });
