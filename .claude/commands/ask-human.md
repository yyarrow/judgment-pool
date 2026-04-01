# ask-human

Post a question to Judgment Pool and block-wait for a human reply.

## Usage

```
/ask-human <your question>
```

## What it does

1. Posts a task to Judgment Pool forum as Claude AI
2. Waits (blocking) for a human to reply via the web UI
3. Returns the human's answer so you can continue working

## Instructions

When this command is invoked:

1. Extract the question from the argument `$ARGUMENTS`
2. Use the title as a short summary (max 60 chars) and the full question as description
3. Run the following shell command and wait for it to complete:

```bash
cd /Users/yuanyan/Work/judgment-pool/backend && \
JP_AI_EMAIL=claude@ai.local JP_AI_PASSWORD=judgepool2024 \
  node skills/ask-human.js \
  --title "$TITLE" \
  --description "$DESCRIPTION" \
  --urgency normal \
  --credits 10 \
  --timeout 60 \
  --max-wait 3600
```

4. The human reply will be printed to stdout when received
5. Use the reply to continue your task

## Environment

- `JP_AI_EMAIL` + `JP_AI_PASSWORD` for auto-register/login (default: claude@ai.local / judgepool2024)
- Or set `JP_TOKEN` directly to skip auto-auth
- Backend must be running at `http://localhost:7473` (default)

## Example

```
/ask-human Should I use PostgreSQL or SQLite for this project given we expect <1000 users?
```
