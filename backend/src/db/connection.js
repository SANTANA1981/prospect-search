const { Pool } = require('pg');

const schemaSql = `
CREATE TABLE IF NOT EXISTS searches (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_conversations (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'chat',
  user_message TEXT NOT NULL,
  assistant_message TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fiscal_analyses (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT,
  cnpj CHAR(14) NOT NULL,
  analysis JSONB NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, cnpj)
);

CREATE INDEX IF NOT EXISTS idx_fiscal_analyses_cnpj ON fiscal_analyses (cnpj);
CREATE INDEX IF NOT EXISTS idx_fiscal_analyses_expires_at ON fiscal_analyses (expires_at);
`;

const connectionString = process.env.DATABASE_URL;

const pool = connectionString
  ? new Pool({
    connectionString,
    ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
  })
  : null;

async function query(text, params) {
  if (!pool) {
    const error = new Error('DATABASE_URL is not configured');
    error.code = 'DATABASE_NOT_CONFIGURED';
    throw error;
  }

  return pool.query(text, params);
}

async function ensureSchema() {
  if (!pool) {
    return;
  }

  await pool.query(schemaSql);
}

async function end() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  query,
  ensureSchema,
  end,
  isConfigured: Boolean(pool),
};
