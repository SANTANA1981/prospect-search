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
