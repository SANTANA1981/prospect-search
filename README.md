# prospect-search
Web application for B2B prospecting with advanced filters

## Backend accounting agent

Endpoints:
- `POST /api/agent/chat`
- `POST /api/agent/analyze`
- `GET /api/agent/history`

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
