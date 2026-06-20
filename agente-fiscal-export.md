# Agente Fiscal — Documento de Exportação

Este arquivo resume a estrutura do agente fiscal do projeto `prospect-search` e foi preparado para ser vinculado ou lido por outro projeto local.

## Objetivo

O agente atua como um assistente para escritório contábil/fiscal, com foco em:

- triagem de solicitações
- validação de CPF/CNPJ
- classificação de temas fiscais e correlatos
- análise de dados cadastrais e situação fiscal
- resposta assistida com fallback determinístico

## Estrutura principal

- `backend/src/index.js`
  - sobe o servidor Express
  - registra rotas principais
  - inicializa o schema do banco

- `backend/src/routes/agent.js`
  - expõe os endpoints do agente

- `backend/src/routes/whatsapp.js`
  - recebe e envia mensagens via WhatsApp

- `backend/src/agents/fiscal-agent/index.js`
  - contém as regras centrais do agente
  - faz classificação, validação, consulta externa e montagem da resposta

- `backend/sql/fiscal-agent-schema.sql`
  - define as tabelas usadas pelo agente

## Endpoints

### `POST /api/agent/chat`

Recebe mensagem livre ou dados estruturados.

Campos comuns:

- `cliente`
- `cnpj_cpf`
- `tipo_solicitacao`
- `periodo_referencia`
- `documentos`
- `prazo_desejado`

Retorno esperado:

- `summary`
- `status`
- `classification`
- `missing_fields`
- `missing_documents`
- `responsible`
- `estimated_deadline`
- `next_steps`
- `completion`

### `POST /api/agent/analyze`

Analisa `cnpj`, `cpf` ou lista `cnpjs[]`.

### `GET /api/agent/history`

Retorna histórico de conversas e análises do usuário.

### `GET /api/whatsapp/webhook`

Valida webhook do WhatsApp.

### `POST /api/whatsapp/webhook`

Recebe mensagens inbound do WhatsApp e encaminha para o agente.

### `POST /api/whatsapp/send`

Envia mensagens outbound pelo provider configurado.

## Fluxo de processamento

1. A mensagem ou os dados estruturados entram pelo endpoint.
2. O agente monta o intake.
3. A classificação define o tema: fiscal, contábil, trabalhista, financeiro ou documentos.
4. O agente valida CPF/CNPJ e extrai período/documentos.
5. Se houver CNPJ válido, ele consulta dados externos.
6. O sistema monta a resposta final.
7. Quando o banco estiver configurado, a conversa é salva.

## Regras centrais do agente

- usa palavras-chave para classificar o pedido
- detecta prioridade com base em termos como urgência, multa e fiscalização
- identifica pendências obrigatórias
- sinaliza quando há necessidade de revisão humana
- usa LLM apenas quando o caso está completo e há mensagem útil para resposta

## Integrações externas

- **BrasilAPI**
  - consulta CNPJ
- **OpenAI / LLM**
  - gera resposta assistida quando habilitado
- **WhatsApp Provider**
  - envia e recebe mensagens

## Variáveis de ambiente

- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `BRASILAPI_BASE_URL`
- `FISCAL_STATUS_API_URL`
- `FISCAL_CERTIDAO_API_URL`
- `WHATSAPP_OWNER_PHONE`
- `WHATSAPP_WEBHOOK_TOKEN`
- `WHATSAPP_WEBHOOK_SECRET`
- `WHATSAPP_PROVIDER_URL`
- `WHATSAPP_PROVIDER_TOKEN`

## Banco de dados

Tabelas principais:

- `searches`
- `agent_conversations`
- `fiscal_analyses`

## Arquitetura resumida

```text
Cliente / WhatsApp / Outro projeto
        |
        v
   Rotas Express
        |
        v
 fiscal-agent
        |
        +--> valida CPF/CNPJ
        +--> classifica solicitação
        +--> consulta APIs externas
        +--> gera resposta
        +--> salva histórico
```

## Como vincular em outro projeto

Você pode apontar seu notebook ou outro projeto local para este arquivo e lê-lo como documentação de referência.

Exemplo de uso esperado:

- importar o caminho do arquivo
- carregar o conteúdo em uma página, widget ou pipeline local
- usar como base para exibir a arquitetura do agente

## Observação

Este documento foi criado para exportação rápida e leitura externa, sem depender do restante do código para ser entendido.
