#!/usr/bin/env node
/**
 * Post a judgment task to the pool.
 * Usage: node post_task.js --title "..." --description "..." [--urgency normal|urgent|critical] [--credits 20]
 * Output: JSON { task_id, credits_offered, status }
 */
const { parseArgs, api } = require('./_utils');

const args = parseArgs({
  title:       { required: true },
  description: { required: true },
  urgency:     { default: 'normal' },
  credits:     { default: null },
});

(async () => {
  const body = {
    title: args.title,
    description: args.description,
    urgency: args.urgency,
  };
  if (args.credits) body.credits_offered = Number(args.credits);

  const { task } = await api('POST', '/tasks', body);
  console.log(JSON.stringify({ task_id: task.id, credits_offered: task.credits_offered, status: task.status }));
})().catch(e => { console.error(e.message); process.exit(1); });
