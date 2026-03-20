/**
 * Shared utilities for Judgment Pool skill scripts.
 */
const https = require('https');
const http = require('http');

const BASE_URL = process.env.JUDGMENT_POOL_URL || 'http://localhost:3000/api';
const TOKEN    = process.env.JUDGMENT_POOL_TOKEN || '';

/**
 * Simple HTTP client (no external deps).
 */
function api(method, path, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(BASE_URL + path);
    const data = body ? JSON.stringify(body) : null;
    const opts = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TOKEN}`,
        ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
      },
    };
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(opts, res => {
      let raw = '';
      res.on('data', c => raw += c);
      res.on('end', () => {
        try {
          const json = JSON.parse(raw);
          if (res.statusCode >= 400) return reject(new Error(json.error || raw));
          resolve(json);
        } catch { reject(new Error(raw)); }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

/**
 * Minimal arg parser: --key value or --key=value
 * schema: { key: { required?: bool, default?: any } }
 */
function parseArgs(schema = {}) {
  const argv = process.argv.slice(2);
  const result = {};

  // Set defaults
  for (const [k, v] of Object.entries(schema)) {
    if (v.default !== undefined && v.default !== null) result[k] = v.default;
  }

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg.startsWith('--')) {
      const eqIdx = arg.indexOf('=');
      if (eqIdx > -1) {
        result[arg.slice(2, eqIdx)] = arg.slice(eqIdx + 1);
      } else {
        const key = arg.slice(2);
        result[key] = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      }
    }
  }

  for (const [k, v] of Object.entries(schema)) {
    if (v.required && result[k] === undefined) {
      console.error(`Missing required argument: --${k}`);
      process.exit(1);
    }
  }
  return result;
}

module.exports = { api, parseArgs };
