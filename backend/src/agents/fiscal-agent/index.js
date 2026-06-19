const axios = require('axios');
const db = require('../../db/connection');

const SYSTEM_PROMPT = `
Você é um analista fiscal sênior brasileiro.
Responda de forma objetiva, técnica e segura.
Considere ICMS, ISS, PIS/COFINS, IRPJ, CSLL, Simples Nacional, obrigações acessórias e risco fiscal.
Use a lógica de um especialista de elite: CFOP, CST/CSOSN, NCM/CEST, devolução, retorno, remessa, industrialização, consignação, crédito, retenção, DIFAL, ST, FCP e reforma tributária.
Quando houver incerteza, deixe claro o que foi inferido e o que precisa de validação humana.
Sempre responda com enquadramento, justificativa técnica, riscos, impactos e próximos passos práticos.
`;

function sanitizeCnpj(value) {
  return String(value || '').replace(/\D/g, '').padStart(14, '0').slice(0, 14);
}

function isValidCnpj(cnpj) {
  return /^\d{14}$/.test(cnpj);
}

function extractCnpjs(text) {
  return String(text || '').match(/\d{14}/g) || [];
}

function normalizeCompany(data = {}) {
  const activity = data.atividade_principal || data.main_activity || data.cnae_fiscal || null;
  const porte = data.porte || null;

  return {
    cnpj: sanitizeCnpj(data.cnpj || data.numero_de_inscricao || ''),
    razao_social: data.razao_social || data.nome || data.nome_empresarial || null,
    nome_fantasia: data.nome_fantasia || data.fantasia || null,
    situacao_cadastral: data.descricao_situacao_cadastral || data.situacao_cadastral || data.status || null,
    natureza_juridica: data.natureza_juridica || null,
    porte,
    regime_tributario: data.regime_tributario || data.regime || null,
    atividade_principal: activity,
    atividades_secundarias: data.atividades_secundarias || data.secondary_activities || [],
    endereco: data.logradouro || data.endereco || null,
    municipio: data.municipio || data.cidade || null,
    uf: data.uf || null,
    origem_dados: data,
  };
}

async function buscarCnpj(cnpj) {
  const sanitized = sanitizeCnpj(cnpj);
  if (!isValidCnpj(sanitized)) {
    return {
      cnpj: sanitized,
      error: 'CNPJ inválido',
    };
  }

  const baseUrl = (process.env.BRASILAPI_BASE_URL || 'https://brasilapi.com.br/api/cnpj/v1').replace(/\/$/, '');
  const response = await axios.get(`${baseUrl}/${sanitized}`, { timeout: 15000 });
  return normalizeCompany(response.data);
}

function analyzeRegime(company) {
  const text = [
    company.regime_tributario,
    company.porte,
    company.atividade_principal?.texto,
    company.natureza_juridica,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  let regime = 'Indeterminado';
  const reasons = [];

  if (text.includes('simples') || text.includes('mei')) {
    regime = 'Simples Nacional';
    reasons.push('Há indícios explícitos de enquadramento simplificado.');
  } else if (text.includes('lucro real')) {
    regime = 'Lucro Real';
    reasons.push('Regime informado ou inferido como Lucro Real.');
  } else if (text.includes('lucro presumido')) {
    regime = 'Lucro Presumido';
    reasons.push('Regime informado ou inferido como Lucro Presumido.');
  } else if (text.includes('microempresa') || text.includes('epp') || text.includes('pequeno')) {
    regime = 'Potencial Simples Nacional';
    reasons.push('Porte compatível com análise preliminar de Simples Nacional.');
  }

  return {
    regime_estimado: regime,
    justificativa: reasons.length ? reasons : ['Sem dados suficientes para uma inferência segura.'],
    confianca: regime === 'Indeterminado' ? 'baixa' : 'média',
  };
}

async function verificarSituacaoFiscal(company) {
  const alerts = [];

  if (company.situacao_cadastral && !/ativa|ativo|regular/i.test(company.situacao_cadastral)) {
    alerts.push(`Situação cadastral não ativa: ${company.situacao_cadastral}`);
  }

  const statusApi = process.env.FISCAL_STATUS_API_URL;
  const certidaoApi = process.env.FISCAL_CERTIDAO_API_URL;

  const externalChecks = [];
  if (statusApi) {
    externalChecks.push(
      axios.get(`${statusApi.replace(/\/$/, '')}/${company.cnpj}`, { timeout: 15000 })
        .then((response) => ({ source: 'status_api', data: response.data }))
        .catch((error) => ({ source: 'status_api', error: error.message }))
    );
  }

  if (certidaoApi) {
    externalChecks.push(
      axios.get(`${certidaoApi.replace(/\/$/, '')}/${company.cnpj}`, { timeout: 15000 })
        .then((response) => ({ source: 'certidao_api', data: response.data }))
        .catch((error) => ({ source: 'certidao_api', error: error.message }))
    );
  }

  const external = await Promise.all(externalChecks);

  const status = alerts.length ? 'atenção' : 'aparentemente_regular';
  return {
    status,
    alertas: alerts,
    fontes_consultadas: external,
    observacao: external.length ? 'Consulta externa executada quando configurada.' : 'Sem APIs fiscais configuradas; análise inferida a partir do CNPJ.',
  };
}

async function buscarEmpresasPorPerfil({ userId, perfil = {}, limit = 10 } = {}) {
  if (!db.isConfigured) {
    return { results: [], source: 'database_unavailable' };
  }

  const normalizedLimit = Math.max(1, Math.min(Number(limit) || 10, 50));
  const params = [];
  const clauses = [];

  if (userId) {
    params.push(userId);
    clauses.push(`user_id = $${params.length}`);
  }

  if (perfil.nome) {
    params.push(`%${perfil.nome}%`);
    clauses.push(`name ILIKE $${params.length}`);
  }

  const sql = `
    SELECT id, name, filters, created_at, updated_at
    FROM searches
    ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
    ORDER BY updated_at DESC
    LIMIT ${normalizedLimit}
  `;

  const result = await db.query(sql, params);
  return {
    source: 'searches',
    results: result.rows,
  };
}

function gerarRelatorioFiscal({ company, regime, situacao, matchingSearches = [] }) {
  const summary = {
    cnpj: company.cnpj,
    razao_social: company.razao_social,
    regime_estimado: regime.regime_estimado,
    situacao_fiscal: situacao.status,
    alertas: situacao.alertas,
    buscas_relacionadas: matchingSearches.length,
  };

  const markdown = [
    `# Relatório Fiscal`,
    `**CNPJ:** ${company.cnpj}`,
    `**Razão social:** ${company.razao_social || 'Não informado'}`,
    `**Regime estimado:** ${regime.regime_estimado}`,
    `**Situação fiscal:** ${situacao.status}`,
    '',
    '## Justificativas',
    ...(regime.justificativa || []).map((item) => `- ${item}`),
    '',
    '## Alertas',
    ...(situacao.alertas?.length ? situacao.alertas.map((item) => `- ${item}`) : ['- Nenhum alerta objetivo identificado']),
  ].join('\n');

  return { summary, markdown };
}

async function callLlm(messages) {
  const apiKey = process.env.OPENAI_API_KEY || process.env.LLM_API_KEY;
  if (!apiKey) {
    return null;
  }

  const baseURL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
  const model = process.env.OPENAI_MODEL || process.env.LLM_MODEL || 'gpt-4o-mini';

  const response = await axios.post(
    `${baseURL}/chat/completions`,
    {
      model,
      messages,
      temperature: 0.2,
    },
    {
      timeout: 30000,
      headers: {
        Authorization: ['Bearer', apiKey].join(' '),
        'Content-Type': 'application/json',
      },
    }
  );

  return response.data?.choices?.[0]?.message?.content || null;
}

function buildChatFallback({ message, company, regime, situacao, matchingSearches }) {
  const lines = [
    `Analise preliminar para: ${message}`,
  ];

  if (company?.cnpj) {
    lines.push(`CNPJ identificado: ${company.cnpj}`);
  }

  lines.push(`Regime estimado: ${regime.regime_estimado}`);
  lines.push(`Situação fiscal: ${situacao.status}`);

  if (situacao.alertas?.length) {
    lines.push(`Alertas: ${situacao.alertas.join('; ')}`);
  }

  if (matchingSearches?.length) {
    lines.push(`Buscas relacionadas no banco: ${matchingSearches.length}`);
  }

  return lines.join('\n');
}

async function chat({ message, user, context = {} }) {
  const cnpjs = [...new Set([...(context.cnpjs || []), ...extractCnpjs(message)])];
  const company = cnpjs.length ? await buscarCnpj(cnpjs[0]).catch((error) => ({ cnpj: cnpjs[0], error: error.message })) : null;
  const regime = company ? analyzeRegime(company) : { regime_estimado: 'Indeterminado', justificativa: ['Nenhum CNPJ informado.'] };
  const situacao = company ? await verificarSituacaoFiscal(company).catch((error) => ({ status: 'erro', alertas: [error.message], fontes_consultadas: [] })) : { status: 'nao_avaliada', alertas: [], fontes_consultadas: [] };
  const matchingSearches = await buscarEmpresasPorPerfil({ userId: user?.id, perfil: context.perfil || {}, limit: 5 }).catch(() => ({ results: [] }));
  const report = company ? gerarRelatorioFiscal({ company, regime, situacao, matchingSearches: matchingSearches.results || [] }) : null;

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Pergunta do usuário: ${message}` },
    { role: 'assistant', content: JSON.stringify({ company, regime, situacao, matchingSearches: matchingSearches.results || [], report }, null, 2) },
  ];

  const llmAnswer = await callLlm(messages);
  const answer = llmAnswer || buildChatFallback({
    message,
    company,
    regime,
    situacao,
    matchingSearches: matchingSearches.results || [],
  });

  return {
    answer,
    company,
    regime,
    situacao,
    matchingSearches: matchingSearches.results || [],
    report,
  };
}

async function analyze({ cnpjs = [], user } = {}) {
  const normalized = [...new Set(cnpjs.map(sanitizeCnpj).filter(isValidCnpj))];
  const analyses = [];

  for (const cnpj of normalized) {
    const company = await buscarCnpj(cnpj).catch((error) => ({ cnpj, error: error.message }));
    const regime = analyzeRegime(company);
    const situacao = await verificarSituacaoFiscal(company).catch((error) => ({ status: 'erro', alertas: [error.message], fontes_consultadas: [] }));
    const report = gerarRelatorioFiscal({ company, regime, situacao });

    analyses.push({
      cnpj,
      company,
      regime,
      situacao,
      report,
    });

    if (db.isConfigured) {
      const ttlHours = Math.max(1, Number(process.env.FISCAL_ANALYSIS_TTL_HOURS || 24));
      await db.query(
        `
        INSERT INTO fiscal_analyses (user_id, cnpj, analysis, expires_at, updated_at)
        VALUES ($1, $2, $3, NOW() + ($4 || ' hours')::interval, NOW())
        ON CONFLICT (user_id, cnpj)
        DO UPDATE SET analysis = EXCLUDED.analysis, expires_at = EXCLUDED.expires_at, updated_at = NOW()
        `,
        [user?.id || null, cnpj, JSON.stringify(report), String(ttlHours)]
      ).catch(() => null);
    }
  }

  return {
    total: analyses.length,
    analyses,
  };
}

async function saveConversation({ userId, userMessage, assistantMessage, metadata = {} }) {
  if (!db.isConfigured) {
    return;
  }

  await db.query(
    `
    INSERT INTO agent_conversations (user_id, conversation_type, user_message, assistant_message, metadata)
    VALUES ($1, 'chat', $2, $3, $4)
    `,
    [userId, userMessage, assistantMessage, JSON.stringify(metadata)]
  ).catch(() => null);
}

module.exports = {
  SYSTEM_PROMPT,
  sanitizeCnpj,
  isValidCnpj,
  extractCnpjs,
  buscarCnpj,
  analyzeRegime,
  verificarSituacaoFiscal,
  buscarEmpresasPorPerfil,
  gerarRelatorioFiscal,
  chat,
  analyze,
  saveConversation,
};
