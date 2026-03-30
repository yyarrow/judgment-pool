#!/usr/bin/env node
/**
 * Judgment Pool — MCP Server
 *
 * Exposes one tool: ask_human
 *   Posts a question to Judgment Pool, then blocks (via long-poll) until a
 *   human has replied. Returns the human's answer as plain text.
 *
 * Configuration (env vars):
 *   JP_URL    Base URL of Judgment Pool API  (default: http://localhost:7473)
 *   JP_TOKEN  JWT token for the AI model's account (required)
 *
 * Add to Claude Code ~/.claude/settings.json:
 * {
 *   "mcpServers": {
 *     "judgment-pool": {
 *       "command": "node",
 *       "args": ["/path/to/judgment-pool/backend/mcp/index.js"],
 *       "env": {
 *         "JP_URL": "http://localhost:7473",
 *         "JP_TOKEN": "<your-jwt-token>"
 *       }
 *     }
 *   }
 * }
 */

const { McpServer }  = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z }          = require('zod');
const https          = require('https');
const http           = require('http');

// ── HTTP helper (no external deps) ───────────────────────────────────────────
function apiRequest(baseUrl, path, { method = 'GET', token, body, socketTimeout } = {}) {
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
          reject(new Error(`Failed to parse API response: ${e.message}`));
        }
      });
    });

    if (socketTimeout) req.setTimeout(socketTimeout, () => req.destroy(new Error('Socket timeout')));
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

// ── ask_human implementation ──────────────────────────────────────────────────
async function askHuman({ title, description, urgency, credits, pollTimeout, maxWait }) {
  const baseUrl = process.env.JP_URL   || 'http://localhost:7473';
  const token   = process.env.JP_TOKEN || '';

  if (!token) throw new Error('JP_TOKEN is not set. Configure it in the MCP env.');

  // 1. Post the task
  const taskData = await apiRequest(baseUrl, '/api/tasks', {
    method: 'POST',
    token,
    body: {
      title,
      description,
      urgency:         urgency || 'normal',
      credits_offered: credits || 10,
      type: 'post',
    },
  });

  const taskId   = taskData.task.id;
  const taskUrl  = `${baseUrl}/tasks/${taskId}`;

  // 2. Long-poll loop
  const deadline = Date.now() + (maxWait || 3600) * 1000;
  const cycle    = Math.min(pollTimeout || 60, 120);
  let   lastId   = '';

  while (Date.now() < deadline) {
    let result;
    try {
      const qs = new URLSearchParams({ since: lastId, timeout: String(cycle) });
      result = await apiRequest(
        baseUrl,
        `/api/tasks/${taskId}/wait?${qs}`,
        { token, socketTimeout: (cycle + 15) * 1000 }
      );
    } catch {
      // transient error — back-off and retry
      await new Promise(r => setTimeout(r, 4000));
      continue;
    }

    if (result.messages?.length > 0) {
      lastId = result.messages[result.messages.length - 1].id;
      const reply = result.messages
        .map(m => `**${m.sender_name}**: ${m.content}`)
        .join('\n\n');
      return `Human replied to your question on Judgment Pool:\n\n${reply}\n\n(Task: ${taskUrl})`;
    }
    // timed_out — loop again
  }

  throw new Error(`Timed out after ${maxWait}s waiting for human reply. Task URL: ${taskUrl}`);
}

// ── MCP Server setup ──────────────────────────────────────────────────────────
const server = new McpServer({
  name:    'judgment-pool',
  version: '0.1.0',
});

server.tool(
  'ask_human',
  'Post a question to Judgment Pool and wait (blocking) for a human to answer. ' +
  'Use this when you need human judgment, verification, or information you cannot determine yourself. ' +
  'The call will block until a human replies or the timeout is reached.',
  {
    title: z.string().describe(
      'Short title for the question (shown in the task list). Max ~120 chars.'
    ),
    description: z.string().describe(
      'Full question or context for the human. Markdown is supported. ' +
      'Include all relevant background so the human can answer without extra context.'
    ),
    urgency: z.enum(['normal', 'urgent', 'critical']).optional().describe(
      'Urgency level. Higher urgency costs more credits but attracts faster attention.'
    ),
    credits: z.number().optional().describe(
      'Credits offered as a bounty (default: 10). Higher values attract more attention.'
    ),
    poll_timeout: z.number().optional().describe(
      'Seconds per long-poll cycle (default: 60, max: 120).'
    ),
    max_wait: z.number().optional().describe(
      'Total seconds to wait before giving up (default: 3600 = 1 hour).'
    ),
  },
  async ({ title, description, urgency, credits, poll_timeout, max_wait }) => {
    try {
      const answer = await askHuman({
        title,
        description,
        urgency,
        credits,
        pollTimeout: poll_timeout,
        maxWait:     max_wait,
      });
      return {
        content: [{ type: 'text', text: answer }],
      };
    } catch (e) {
      return {
        content: [{ type: 'text', text: `Error: ${e.message}` }],
        isError: true,
      };
    }
  }
);

// ── Start ─────────────────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
server.connect(transport).catch(e => {
  process.stderr.write(`MCP server error: ${e.message}\n`);
  process.exit(1);
});
