# Agente Fiscal — Estrutura, Conhecimento e Diretrizes

Este documento resume o agente fiscal do projeto `prospect-search`, com foco em estrutura, competências, comportamento e base de conhecimento já incorporada.

## 1. Visão geral

O agente é um assistente fiscal/contábil para triagem, validação, análise e encaminhamento de solicitações.

Ele foi pensado para:

- classificar pedidos
- validar dados cadastrais
- identificar documentos faltantes
- analisar contexto fiscal
- sugerir responsável e prazo
- encaminhar para revisão humana quando necessário
- responder de forma objetiva e segura

## 2. Estrutura do projeto

### Backend

- `backend/src/index.js`
  - inicializa o servidor Express
  - aplica segurança, CORS e logs
  - registra rotas principais

- `backend/src/routes/agent.js`
  - expõe os endpoints do agente

- `backend/src/routes/whatsapp.js`
  - recebe e envia mensagens via WhatsApp

- `backend/src/routes/search.js`
  - gerencia buscas salvas

- `backend/src/routes/dashboard.js`
  - fornece métricas resumidas

- `backend/src/db/connection.js`
  - conexão com PostgreSQL e init de schema

### Núcleo do agente

- `backend/src/agents/fiscal-agent/index.js`
  - contém as regras do agente
  - faz a classificação
  - valida CPF/CNPJ
  - monta o intake
  - consulta serviços externos
  - gera resposta final

### Banco

- `backend/sql/fiscal-agent-schema.sql`
  - define tabelas do agente

## 3. Endpoints principais

### `POST /api/agent/chat`

Recebe mensagem livre ou dados estruturados.

Campos aceitos:

- `cliente`
- `cnpj_cpf`
- `tipo_solicitacao`
- `periodo_referencia`
- `documentos`
- `prazo_desejado`

Retorno:

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

Analisa:

- `cnpj`
- `cpf`
- `cnpjs[]`

### `GET /api/agent/history`

Retorna o histórico de conversas e análises.

### WhatsApp

- `GET /api/whatsapp/webhook`
- `POST /api/whatsapp/webhook`
- `POST /api/whatsapp/send`

## 4. Competências do agente

### Fiscal

- NF-e
- CT-e
- NFS-e
- XML fiscal
- CFOP
- CST/CSOSN
- NCM
- apuração
- retenções
- DIFAL
- ST
- FCP
- IRPJ
- CSLL
- Simples Nacional
- certidões
- fiscalização
- autos de infração

### Contábil

- balancete
- razão
- diário
- lançamentos
- conciliações
- fechamento contábil
- balanço
- DRE

### Trabalhista

- folha
- eSocial
- férias
- rescisão
- admissão
- 13º
- FGTS
- INSS

### Financeiro

- fluxo de caixa
- contas a pagar
- contas a receber
- conciliação bancária
- boletos
- cobranças
- pagamentos
- recebimentos

### Documentos

- legibilidade
- autenticidade
- completude
- contratos
- cartão CNPJ
- procurações
- certificado digital

## 5. Diretrizes de comportamento

O agente deve:

- responder com objetividade
- não inventar dados
- pedir apenas o que estiver faltando
- detectar inconsistências
- sinalizar risco fiscal ou legal
- encaminhar para humano quando houver dúvida sensível
- manter linguagem clara e profissional

## 6. Regras internas

O agente usa:

- classificação por palavras-chave
- validação de CPF/CNPJ
- extração de período
- detecção de prioridade
- verificação de documentos
- escalonamento por risco

## 7. Fluxo de operação

```text
Entrada do usuário
  → classificação
  → validação
  → montagem do intake
  → consulta externa (quando aplicável)
  → resposta final
  → gravação de histórico
```

## 8. Base de conhecimento já presente

O conhecimento embutido no agente cobre principalmente:

- análise de XML fiscal
- leitura de NF-e, CT-e e NFS-e
- relação entre CFOP de XML e escrituração
- interpretação de natureza da operação
- noções de crédito, débito e enquadramento fiscal
- cenários de operação interestadual
- validação prática para análise fiscal do dia a dia

## 9. Integrações

- **BrasilAPI**
  - consulta CNPJ

- **OpenAI / LLM**
  - respostas geradas quando o caso está completo

- **WhatsApp Provider**
  - envio e recebimento de mensagens

## 10. Variáveis de ambiente

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

## 11. Banco de dados

Tabelas usadas:

- `searches`
- `agent_conversations`
- `fiscal_analyses`

## 12. Resumo final

Este agente é um núcleo de análise fiscal/contábil com:

- triagem
- classificação
- validação
- orientação inicial
- integração externa
- histórico persistente

Ele já nasce preparado para apoiar operações fiscais e também para servir como base de conhecimento consumível por outro projeto local.
