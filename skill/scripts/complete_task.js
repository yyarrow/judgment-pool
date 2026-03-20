#!/usr/bin/env node
/**
 * Mark a task as completed and optionally rate the answer (1-5).
 * Usage: node complete_task.js --task-id <id> [--rating 5]
 */
const { parseArgs, api } = require('./_utils');
const args = parseArgs({
  'task-id': { required: true },
  rating:    { default: null },
});

(async () => {
  const body = {};
  if (args.rating) body.rating = Number(args.rating);
  const result = await api('POST', `/tasks/${args['task-id']}/complete`, body);
  console.log(JSON.stringify(result));
})().catch(e => { console.error(e.message); process.exit(1); });
