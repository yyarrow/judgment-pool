const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-in-production';
const INITIAL_CREDITS = parseInt(process.env.INITIAL_CREDITS || '100');

router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'name, email, password required' });
    const hash = bcrypt.hashSync(password, 10);
    const id = uuidv4();
    await db.runAsync(
      `INSERT INTO users (id, name, email, password_hash, credits) VALUES (?,?,?,?,?)`,
      [id, name, email, hash, INITIAL_CREDITS]
    );
    const token = jwt.sign({ id, name, email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id, name, email, credits: INITIAL_CREDITS } });
  } catch (e) {
    if (e.message?.includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db.getAsync(`SELECT * FROM users WHERE email = ?`, [email]);
    if (!user || !bcrypt.compareSync(password, user.password_hash))
      return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, credits: user.credits } });
  } catch (e) { next(e); }
});

module.exports = router;
