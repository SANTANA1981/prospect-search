const express = require('express');
const authMiddleware = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const db = require('../db/connection');
const fiscalAgent = require('../agents/fiscal-agent');

const router = express.Router();
const limiter = rateLimit({
  windowMs: Number(process.env.FISCAL_AGENT_RATE_LIMIT_WINDOW_MS || 60_000),
  max: Number(process.env.FISCAL_AGENT_RATE_LIMIT_MAX || 20),
});

router.post('/chat', limiter, authMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const context = payload.context || payload;
    const message = payload.message || payload.request || [
      payload.tipo_solicitacao,
      payload.cliente,
      payload.cnpj_cpf,
      payload.periodo_referencia,
    ].filter(Boolean).join(' - ');

    if (!String(message || '').trim() && !payload.tipo_solicitacao && !payload.cnpj_cpf && !payload.cliente) {
      return res.status(400).json({ error: 'message or structured intake data is required' });
    }

    const result = await fiscalAgent.chat({
      message: String(message),
      context,
      user: req.user,
    });

    await fiscalAgent.saveConversation({
      userId: req.user.id,
      userMessage: String(message),
      assistantMessage: result.answer,
      metadata: {
        cnpj: result.inputs?.cnpj || result.company?.cnpj || null,
        cpf: result.inputs?.cpf || null,
        tema: result.classification?.topic || null,
        status: result.status || null,
        responsible: result.responsible || null,
      },
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.post('/analyze', limiter, authMiddleware, async (req, res) => {
  try {
    const payload = req.body || {};
    const cnpjs = Array.isArray(payload.cnpjs) ? payload.cnpjs : [];
    const cnpj = payload.cnpj ? [payload.cnpj] : [];
    const cpf = payload.cpf ? [payload.cpf] : [];
    const identifiers = [...cnpjs, ...cnpj, ...cpf];

    if (!identifiers.length) {
      return res.status(400).json({ error: 'cnpj, cpf or cnpjs is required' });
    }

    const result = await fiscalAgent.analyze({
      cnpjs: identifiers,
      user: req.user,
    });

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.get('/history', limiter, authMiddleware, async (req, res) => {
  if (!db.isConfigured) {
    return res.json({
      conversations: [],
      analyses: [],
      note: 'DATABASE_URL is not configured',
    });
  }

  try {
    const [conversations, analyses] = await Promise.all([
      db.query(
        `
        SELECT id, conversation_type, user_message, assistant_message, metadata, created_at
        FROM agent_conversations
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT 50
        `,
        [req.user.id]
      ),
      db.query(
        `
        SELECT id, cnpj, analysis, expires_at, created_at, updated_at
        FROM fiscal_analyses
        WHERE user_id = $1
        ORDER BY updated_at DESC
        LIMIT 50
        `,
        [req.user.id]
      ),
    ]);

    return res.json({
      conversations: conversations.rows,
      analyses: analyses.rows,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

module.exports = router;
