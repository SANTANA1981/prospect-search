const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

router.post('/token', (req, res) => {
  const { id, email, name, role = 'user' } = req.body || {};

  if (!id && !email) {
    return res.status(400).json({ error: 'id or email is required' });
  }

  const userId = String(id || email);
  const token = jwt.sign({ id: userId, email, name, role }, process.env.JWT_SECRET || 'dev-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  });

  return res.json({
    token,
    user: { id: userId, email, name, role },
  });
});

router.get('/me', (req, res) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Missing authorization token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
    return res.json({ user: payload });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
