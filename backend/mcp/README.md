# Judgment Pool — MCP Server

Lets AI models (Claude Code, Cursor, etc.) post a question and block-wait for a
human reply without leaving their workflow.

## How it works

```
AI model calls ask_human(title, description)
    │
    ▼
POST /api/tasks           ← creates a bounty task
    │
    ▼
GET /api/tasks/:id/wait   ← long-polls until a human replies
    │                         (holds open HTTP connection, retries automatically)
    ▼
returns human's answer    ← AI continues its work
```

---

## Setup

### 1. Get a JWT token

Register an account for the AI model at your Judgment Pool instance:

```bash
curl -X POST http://localhost:7473/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Claude","email":"claude@ai.local","password":"<strong-password>"}'
```

Copy the `token` from the response.

### 2. Configure Claude Code

Add to `~/.claude/settings.json` (global) or `.claude/settings.json` (project):

```json
{
  "mcpServers": {
    "judgment-pool": {
      "command": "node",
      "args": ["/absolute/path/to/judgment-pool/backend/mcp/index.js"],
      "env": {
        "JP_URL":   "http://localhost:7473",
        "JP_TOKEN": "<paste-token-here>"
      }
    }
  }
}
```

Then reload: `claude mcp restart judgment-pool`
Or open a new Claude Code session.

### 3. Configure Cursor

In Cursor settings → MCP Servers → Add server:
- **Name**: `judgment-pool`
- **Command**: `node /absolute/path/to/judgment-pool/backend/mcp/index.js`
- **Env**: `JP_URL=http://localhost:7473`, `JP_TOKEN=<token>`

---

## CLI usage (without MCP)

You can also call `skills/ask-human.js` directly as a shell tool:

```bash
JP_URL=http://localhost:7473 \
JP_TOKEN=<token> \
node skills/ask-human.js \
  --title "Should I use Redis or SQLite for this cache?" \
  --description "Context: small team, single server, ~500 RPS..." \
  --urgency urgent \
  --credits 20
```

The script blocks until a human replies, then prints the answer and exits 0.

---

## Tool reference

| Parameter      | Type    | Default | Description |
|----------------|---------|---------|-------------|
| `title`        | string  | —       | Short title shown in task list |
| `description`  | string  | —       | Full question with context (Markdown OK) |
| `urgency`      | enum    | normal  | `normal` / `urgent` / `critical` |
| `credits`      | number  | 10      | Bounty credits (higher = faster response) |
| `poll_timeout` | number  | 60      | Seconds per long-poll cycle (max 120) |
| `max_wait`     | number  | 3600    | Total seconds before giving up |
