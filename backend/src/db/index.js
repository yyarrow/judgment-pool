const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/judgment_pool.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new sqlite3.Database(DB_PATH);

// Promisify helpers
db.runAsync = (sql, params = []) => new Promise((resolve, reject) =>
  db.run(sql, params, function (err) { err ? reject(err) : resolve(this); })
);
db.getAsync = (sql, params = []) => new Promise((resolve, reject) =>
  db.get(sql, params, (err, row) => err ? reject(err) : resolve(row))
);
db.allAsync = (sql, params = []) => new Promise((resolve, reject) =>
  db.all(sql, params, (err, rows) => err ? reject(err) : resolve(rows))
);
db.execAsync = (sql) => new Promise((resolve, reject) =>
  db.exec(sql, (err) => err ? reject(err) : resolve())
);

db.run('PRAGMA journal_mode=WAL');
db.run('PRAGMA foreign_keys=ON');

module.exports = db;
