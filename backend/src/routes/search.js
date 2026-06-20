const express = require('express');
const router = express.Router();
const db = require('../db/connection');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: Number(process.env.SEARCH_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.SEARCH_RATE_LIMIT_MAX || 30),
});

// Get all searches for user
router.get('/', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(
      'SELECT id, name, filters, created_at, updated_at FROM searches WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new search
router.post('/', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { name, filters } = req.body;
    
    const result = await db.query(
      'INSERT INTO searches (user_id, name, filters) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, JSON.stringify(filters)]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get search by ID
router.get('/:id', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(
      'SELECT * FROM searches WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update search
router.put('/:id', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const { name, filters } = req.body;
    
    const result = await db.query(
      'UPDATE searches SET name = $1, filters = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, JSON.stringify(filters), req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete search
router.delete('/:id', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  try {
    const result = await db.query(
      'DELETE FROM searches WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Search not found' });
    }
    
    res.json({ message: 'Search deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;