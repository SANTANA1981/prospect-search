# prospect-search
Web application for B2B prospecting with advanced filters

## Backend accounting agent

Endpoints:
- `POST /api/agent/chat`
- `POST /api/agent/analyze`
- `GET /api/agent/history`
- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
- `POST /api/whatsapp/send`

`POST /api/agent/chat` accepts message or structured intake fields for an accounting office:
- `cliente`
- `cnpj_cpf`
- `tipo_solicitacao`
- `periodo_referencia`
- `documentos`
- `prazo_desejado`

The response includes:
- `classification`
- `status`
- `missing_fields`
- `missing_documents`
- `responsible`
- `estimated_deadline`
- `next_steps`
- `completion`

Environment variables:
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `BRASILAPI_BASE_URL`
- `FISCAL_STATUS_API_URL`
- `FISCAL_CERTIDAO_API_URL`
- `WHATSAPP_OWNER_PHONE`
- `WHATSAPP_WEBHOOK_TOKEN`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`

When `WHATSAPP_OWNER_PHONE` is set, messages from that number are treated as the owner (Rogerio); other WhatsApp numbers are treated as clients.
