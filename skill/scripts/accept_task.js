#!/usr/bin/env node
/**
 * Accept an open task (claim it as responder).
 * Usage: node accept_task.js --task-id <id>
 */
const { parseArgs, api } = require('./_utils');
const args = parseArgs({ 'task-id': { required: true } });

(async () => {
  const result = await api('POST', `/tasks/${args['task-id']}/accept`);
  console.log(JSON.stringify(result));
})().catch(e => { console.error(e.message); process.exit(1); });
