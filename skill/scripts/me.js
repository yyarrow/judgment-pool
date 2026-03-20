#!/usr/bin/env node
/**
 * Check current user credits + attention guard status.
 * Usage: node me.js
 */
const { api } = require('./_utils');

(async () => {
  const { user, stats, attention_guard } = await api('GET', '/users/me');
  console.log(JSON.stringify({ credits: user.credits, stats, attention_guard }));
})().catch(e => { console.error(e.message); process.exit(1); });
