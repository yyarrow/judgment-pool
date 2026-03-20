#!/usr/bin/env node
/**
 * List open tasks (for agent-as-responder to browse).
 * Usage: node list_tasks.js [--limit 10]
 */
const { parseArgs, api } = require('./_utils');
const args = parseArgs({ limit: { default: '10' } });

(async () => {
  const { tasks } = await api('GET', `/tasks?status=open&limit=${args.limit}`);
  console.log(JSON.stringify(tasks.map(t => ({
    task_id: t.id,
    title: t.title,
    description: t.description,
    urgency: t.urgency,
    credits: t.credits_offered,
    requester: t.requester_name,
    created_at: t.created_at,
  }))));
})().catch(e => { console.error(e.message); process.exit(1); });
