#!/usr/bin/env node
/**
 * ask-human.js — Blocking CLI script for AI models to post a question and wait
 * for a human reply on Judgment Pool.
 *
 * Usage (environment variables):
 *   JP_URL       Base URL, e.g. http://localhost:7473  (default)
 *   JP_TOKEN     JWT token for authentication          (required)
 *
 * Or pass directly:
 *   node ask-human.js --url http://... --token ey... --title "..." --description "..."
 *
 * Arguments (can also be passed as JSON via stdin):
 *   --title       Task title (required)
 *   --description Task description / full question (required)
 *   --urgency     normal | urgent | critical  (default: normal)
 *   --credits     Credits to offer as bounty  (default: 10)
 *   --timeout     Seconds to wait per long-poll cycle (default: 60)
 *   --max-wait    Total seconds to wait for answer before giving up (default: 3600)
 *
 * Exits 0 with the human reply printed to stdout.
 * Exits 1 on fatal error.
 */

const https = require('https');
const http  = require('http');
const url   = require('url');

// ── Argument parsing ──────────────────────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    url:         process.env.JP_URL    || 'http://localhost:7473',
    token:       process.env.JP_TOKEN  || '',
    title:       '',
    description: '',
    urgency:     'normal',
    credits:     10,
    timeout:     60,
    maxWait:     3600,
  };

  // Support --key value pairs
  for (let i = 0; i < args.length; i++) {
    const key = args[i].replace(/^--/, '');
    const val = args[i + 1];
    switch (key) {
      case 'url':         opts.url         = val; i++; break;
      case 'token':       opts.token       = val; i++; break;
      case 'title':       opts.title       = val; i++; break;
      case 'description': opts.description = val; i++; break;
      case 'urgency':     opts.urgency     = val; i++; break;
      case 'credits':     opts.credits     = Number(val); i++; break;
      case 'timeout':     opts.timeout     = Number(val); i++; break;
      case 'max-wait':    opts.maxWait     = Number(val); i++; break;
    }
  }

  return opts;
}

// ── HTTP helpers ──────────────────────────────────────────────────────────────
function request(baseUrl, path, { method = 'GET', token, body, longTimeout } = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(path, baseUrl);
    const lib    = parsed.protocol === 'https:' ? https : http;
    const data   = body ? JSON.stringify(body) : undefined;

    const options = {
      hostname: parsed.hostname,
      port:     parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path:     parsed.pathname + parsed.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(data  ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };

    const req = lib.request(options, (res) => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        try {
          const text = Buffer.concat(chunks).toString();
          const json = JSON.parse(text);
          if (res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${json.error || text}`));
          } else {
            resolve(json);
          }
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    if (longTimeout) req.setTimeout(longTimeout * 1000 + 5000, () => req.destroy());
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  if (!opts.token) {
    process.stderr.write('Error: JP_TOKEN env var or --token argument is required\n');
    process.exit(1);
  }
  if (!opts.title || !opts.description) {
    process.stderr.write('Error: --title and --description are required\n');
    process.exit(1);
  }

  // 1. Post the task
  process.stderr.write(`📤 Posting task: "${opts.title}"…\n`);
  let taskData;
  try {
    taskData = await request(opts.url, '/api/tasks', {
      method: 'POST',
      token:  opts.token,
      body: {
        title:       opts.title,
        description: opts.description,
        urgency:     opts.urgency,
        credits_offered: opts.credits,
        type: 'post',
      },
    });
  } catch (e) {
    process.stderr.write(`Error posting task: ${e.message}\n`);
    process.exit(1);
  }

  const taskId = taskData.task.id;
  process.stderr.write(`✅ Task created: ${taskId}\n`);
  process.stderr.write(`🔗 View at: ${opts.url.replace('localhost', '127.0.0.1')}/tasks/${taskId}\n`);
  process.stderr.write(`⏳ Waiting for human reply…\n`);

  // 2. Long-poll loop until we get a message from a human (non-AI sender)
  const deadline = Date.now() + opts.maxWait * 1000;
  let lastMsgId  = '';

  while (Date.now() < deadline) {
    let pollResult;
    try {
      const qs = new URLSearchParams({
        since:   lastMsgId,
        timeout: String(opts.timeout),
      });
      pollResult = await request(
        opts.url,
        `/api/tasks/${taskId}/wait?${qs}`,
        { token: opts.token, longTimeout: opts.timeout + 10 }
      );
    } catch (e) {
      // Network hiccup — retry after a short pause
      process.stderr.write(`Poll error (retrying): ${e.message}\n`);
      await new Promise(r => setTimeout(r, 3000));
      continue;
    }

    if (pollResult.messages && pollResult.messages.length > 0) {
      // Take the latest message as the authoritative reply
      const msgs = pollResult.messages;
      lastMsgId  = msgs[msgs.length - 1].id;

      // Return the full conversation (all new messages joined)
      const reply = msgs.map(m => `[${m.sender_name}]: ${m.content}`).join('\n');
      process.stdout.write(reply + '\n');
      process.exit(0);
    }

    // timed_out=true means no messages in this window; loop and try again
    if (pollResult.timed_out) {
      process.stderr.write(`Still waiting… (${Math.ceil((deadline - Date.now()) / 1000)}s left)\n`);
    }
  }

  process.stderr.write(`Timed out waiting for human reply after ${opts.maxWait}s\n`);

  // Auto-cancel the task so it doesn't linger as "open" on the forum
  try {
    await request(opts.url, `/api/tasks/${taskId}/cancel`, { method: 'POST', token: opts.token });
    process.stderr.write(`🗑  Task ${taskId} auto-cancelled (no reply received)\n`);
  } catch (e) {
    process.stderr.write(`Warning: could not cancel task: ${e.message}\n`);
  }

  process.exit(2);
}

main().catch(e => {
  process.stderr.write(`Fatal: ${e.message}\n`);
  process.exit(1);
});
