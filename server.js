const express = require('express');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');

const JWT_SECRET = process.env.JWT_SECRET || 'cervicare_dev_secret';
const PORT = process.env.PORT || 3000;

// Initialize DB: try native better-sqlite3, fallback to simple JSON file storage
let db;
try {
  const Database = require('better-sqlite3');
  const DB_PATH = path.join(__dirname, 'cervicare.sqlite');
  db = new Database(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      name TEXT,
      joinedAt TEXT
    );
  `);
} catch (err) {
  console.warn('better-sqlite3 not available — using JSON fallback DB:', err && err.message);
  const JSON_DB = path.join(__dirname, 'db.json');
  function load() {
    try { return JSON.parse(fs.readFileSync(JSON_DB, 'utf8')); } catch (e) { return { users: [] }; }
  }
  function save(d) { fs.writeFileSync(JSON_DB, JSON.stringify(d, null, 2)); }
  db = {
    exec: () => {},
    prepare: (sql) => {
      const s = sql.replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.startsWith('SELECT ID FROM USERS WHERE EMAIL')) {
        return { get: (email) => { const d = load(); const u = d.users.find(x => x.email === email); return u ? { id: u.id } : undefined; } };
      }
      if (s.startsWith('INSERT INTO USERS')) {
        return { run: (email, hash, name, joinedAt) => {
          const d = load(); const id = (d.users.reduce((m,u)=>u.id>m?u.id:m,0) || 0) + 1;
          d.users.push({ id, email, passwordHash: hash, name, joinedAt }); save(d); return { lastInsertRowid: id, changes: 1 };
        } };
      }
      if (s.startsWith('SELECT ID, EMAIL, PASSWORDHASH, NAME, JOINEDAT FROM USERS WHERE EMAIL')) {
        return { get: (email) => { const d = load(); return d.users.find(x => x.email === email); } };
      }
      if (s.startsWith('SELECT ID, EMAIL, NAME, JOINEDAT FROM USERS WHERE ID')) {
        return { get: (id) => { const d = load(); const u = d.users.find(x => x.id == id); if (!u) return undefined; return { id: u.id, email: u.email, name: u.name, joinedAt: u.joinedAt }; } };
      }
      if (s.startsWith('UPDATE USERS SET NAME =')) {
        return { run: (name, id) => { const d = load(); const u = d.users.find(x => x.id == id); if (!u) return { changes: 0 }; u.name = name; save(d); return { changes: 1 }; } };
      }
      return { get: () => undefined, run: () => ({ changes: 0 }) };
    }
  };
}

const app = express();
app.use(cors());
app.use(express.json());

// (static serving moved to bottom so API routes are matched first)

// Signup
app.post('/api/auth/signup', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send('Email and password required');
  const lower = email.toLowerCase();
  const exist = db.prepare('SELECT id FROM users WHERE email = ?').get(lower);
  if (exist) return res.status(409).send('User already exists');
  const hash = await bcrypt.hash(password, 10);
  const name = email.split('@')[0];
  const joinedAt = new Date().toISOString();
  const info = db.prepare('INSERT INTO users (email, passwordHash, name, joinedAt) VALUES (?, ?, ?, ?)').run(lower, hash, name, joinedAt);
  res.status(201).json({ ok: true });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).send('Email and password required');
  const lower = email.toLowerCase();
  const user = db.prepare('SELECT id, email, passwordHash, name, joinedAt FROM users WHERE email = ?').get(lower);
  if (!user) return res.status(401).send('Invalid credentials');
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).send('Invalid credentials');
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, joinedAt: user.joinedAt } });
});

// Auth middleware
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) return res.status(401).send('Missing token');
  try {
    const payload = jwt.verify(m[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) { return res.status(401).send('Invalid token'); }
}

// Profile
app.get('/api/profile', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, joinedAt FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).send('User not found');
  res.json(user);
});

// Update profile (name)
app.put('/api/profile', requireAuth, (req, res) => {
  const { name } = req.body || {};
  if (typeof name !== 'string') return res.status(400).send('Name required');
  const info = db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name, req.user.id);
  if (info.changes === 0) return res.status(404).send('User not found');
  const user = db.prepare('SELECT id, email, name, joinedAt FROM users WHERE id = ?').get(req.user.id);
  res.json(user);
});

// Serve static site after API routes so that `/api/*` always matches API first
app.use(express.static(path.join(__dirname)));

// If an `/api/*` path reaches here, return JSON 404 instead of static HTML
app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.listen(PORT, () => console.log(`CerviCare dev server running at http://localhost:${PORT}`));
