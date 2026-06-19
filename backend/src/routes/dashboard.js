const express = require('express');
const authMiddleware = require('../middleware/auth');
const db = require('../db/connection');

const router = express.Router();

router.get('/summary', authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.json({
      searches: 0,
      analyses: 0,
      conversations: 0,
      note: 'DATABASE_URL is not configured',
    });
  }

  try {
    const [searches, analyses, conversations] = await Promise.all([
      db.query('SELECT COUNT(*)::int AS count FROM searches WHERE user_id = $1', [req.user.id]),
      db.query('SELECT COUNT(*)::int AS count FROM fiscal_analyses WHERE user_id = $1', [req.user.id]),
      db.query('SELECT COUNT(*)::int AS count FROM agent_conversations WHERE user_id = $1', [req.user.id]),
    ]);

    return res.json({
      searches: searches.rows[0].count,
      analyses: analyses.rows[0].count,
      conversations: conversations.rows[0].count,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
