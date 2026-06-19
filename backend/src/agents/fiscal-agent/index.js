const axios = require('axios');
const db = require('../../db/connection');

const SERVICE_PROFILES = {
  fiscal: {
    responsible: 'Equipe Fiscal',
    priority: 'alta',
    guidance: 'Conferir obrigações, tributos, notas fiscais e prazos legais.',
    requiredDocuments: ['documentos fiscais do período', 'período de referência'],
  },
  contábil: {
    responsible: 'Equipe Contábil',
    priority: 'média',
    guidance: 'Validar lançamentos, conciliações, balancetes e fechamento contábil.',
    requiredDocuments: ['balancete ou razão', 'extratos ou lançamentos do período'],
  },
  trabalhista: {
    responsible: 'Departamento Pessoal',
    priority: 'alta',
    guidance: 'Conferir folha, eventos trabalhistas e obrigações do eSocial/FGTS.',
    requiredDocuments: ['folha ou evento trabalhista', 'período de referência'],
  },
  financeiro: {
    responsible: 'Financeiro / Contas',
    priority: 'média',
    guidance: 'Validar fluxo de caixa, contas a pagar/receber, extratos e comprovantes.',
    requiredDocuments: ['extratos bancários', 'comprovantes ou contas envolvidas'],
  },
  documentos: {
    responsible: 'Backoffice / Documentação',
    priority: 'baixa',
    guidance: 'Conferir legibilidade, autenticidade e completude dos arquivos enviados.',
    requiredDocuments: ['arquivo legível', 'identificação do documento'],
  },
};

const CLASSIFICATION_KEYWORDS = {
  fiscal: [
    'imposto', 'guia', 'darf', 'das', 'icms', 'iss', 'sped', 'dctf', 'efd', 'nfe', 'nf-e',
    'nota fiscal', 'apuração', 'retenção', 'difal', 'st', 'fcp', 'irpj', 'csll', 'simples',
    'cnd', 'certidão', 'fiscalização', 'auto de infração', 'multa fiscal',
  ],
  contábil: [
    'balancete', 'razão', 'diário', 'lançamento', 'conciliação', 'fechamento contábil',
    'escrituração', 'demonstração', 'balanço', 'dre', 'ativo', 'passivo',
  ],
  trabalhista: [
    'folha', 'esocial', 'e-social', 'férias', 'rescisão', 'admissão', '13º', 'fgts', 'inss',
    'ponto', 'holerite', 'encargo trabalhista', 'sindicato', 'dp',
  ],
  financeiro: [
    'fluxo de caixa', 'contas a pagar', 'contas a receber', 'conciliação bancária', 'boleto',
    'cobrança', 'extrato', 'fatura', 'pagamento', 'recebimento', 'financeiro',
  ],
  documentos: [
    'documento', 'anexo', 'arquivo', 'pdf', 'scan', 'cópia', 'contrato social',
    'alteração contratual', 'cartão cnpj', 'certificado digital', 'procuração',
  ],
};

const ESCALATION_KEYWORDS = [
  'urgente',
  'multa',
  'autuação',
  'auto de infração',
  'fiscalização',
  'bloqueio',
  'ajuizado',
  'processo',
  'prazo fatal',
  'não autorizado',
  'nao autorizado',
  'sigilo',
  'admissão',
  'rescisão',
];

const SYSTEM_PROMPT = `
Você é um agente para escritório de contabilidade no Brasil.
Classifique cada pedido em: fiscal, contábil, trabalhista, financeiro ou documentos.
Responda com objetividade, segurança e sem inventar dados.
Quando faltar informação, peça apenas os dados necessários.
Quando houver risco fiscal, dúvida legal, pedido ambíguo ou dados inconsistentes, sinalize encaminhamento humano.
Sempre devolva: resumo do pedido, status, pendências, orientação inicial, prazo estimado e responsável sugerido.
`;

const TOPIC_ALIASES = {
  contabil: 'contábil',
  contabilidade: 'contábil',
  contábil: 'contábil',
  fiscal: 'fiscal',
  financeiro: 'financeiro',
  documentos: 'documentos',
  documento: 'documentos',
  pessoal: 'trabalhista',
  dp: 'trabalhista',
  trabalhista: 'trabalhista',
};

function digitsOnly(value) {
  return String(value || '').replace(/\D/g, '');
}

function normalizeText(value) {
  return String(value || '').toLowerCase();
}

function isValidCpf(value) {
  const cpf = digitsOnly(value);
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) {
    return false;
  }

  const calcDigit = (base, factor) => {
    const sum = base.split('').reduce((acc, digit) => acc + (Number(digit) * factor--), 0);
    const remainder = (sum * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calcDigit(cpf.slice(0, 9), 10);
  const secondDigit = calcDigit(cpf.slice(0, 10), 11);
  return firstDigit === Number(cpf[9]) && secondDigit === Number(cpf[10]);
}

function isValidCnpj(value) {
  const cnpj = digitsOnly(value);
  if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) {
    return false;
  }

  const calcDigit = (base, weights) => {
    const sum = base
      .split('')
      .reduce((acc, digit, index) => acc + Number(digit) * weights[index], 0);
    const remainder = sum % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(cnpj.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  return firstDigit === Number(cnpj[12]) && secondDigit === Number(cnpj[13]);
}

function normalizeDocuments(documents) {
  if (!documents) {
    return [];
  }

  if (Array.isArray(documents)) {
    return documents.map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof documents === 'string') {
    return documents
      .split(/[,;|]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [String(documents).trim()].filter(Boolean);
}

function extractIdentifiers(message, context = {}) {
  const source = [
    message,
    context.cliente,
    context.nome,
    context.cnpj_cpf,
    context.cnpj,
    context.cpf,
    context.message,
  ]
    .filter(Boolean)
    .join(' ');

  const cpfs = [...new Set((source.match(/\b\d{11}\b/g) || []).filter(isValidCpf))];
  const cnpjs = [...new Set((source.match(/\b\d{14}\b/g) || []).filter(isValidCnpj))];

  return {
    cpf: cpfs[0] || null,
    cnpj: cnpjs[0] || null,
    all: [...cpfs, ...cnpjs],
  };
}

function scoreClassification(text, explicitType) {
  const normalized = normalizeText(text);
  const scores = {
    fiscal: 0,
    contábil: 0,
    trabalhista: 0,
    financeiro: 0,
    documentos: 0,
  };

  Object.entries(CLASSIFICATION_KEYWORDS).forEach(([topic, keywords]) => {
    keywords.forEach((keyword) => {
      if (normalized.includes(keyword)) {
        scores[topic] += keyword.length > 8 ? 2 : 1;
      }
    });
  });

  const selectedType = TOPIC_ALIASES[normalizeText(explicitType)] || normalizeText(explicitType);
  if (scores[selectedType] !== undefined) {
    scores[selectedType] += 4;
  }

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [topic, score] = ranked[0];
  const runnerUp = ranked[1]?.[1] || 0;
  const mixedTopics = ranked.filter(([, value]) => value > 0).map(([name]) => name);

  return {
    topic: score > 0 ? topic : (scores.documentos > 0 ? 'documentos' : 'fiscal'),
    confidence: score >= 4 ? 'alta' : score >= 2 ? 'média' : 'baixa',
    mixed_topics: mixedTopics.length > 1 && score - runnerUp <= 1 ? mixedTopics : [],
    rationale: score > 0
      ? [`Palavras-chave compatíveis com ${topic}.`]
      : ['Sem palavras-chave suficientes; classificação preliminar.'],
  };
}

function detectPriority(text) {
  const normalized = normalizeText(text);
  if (['urgente', 'multa', 'bloqueio', 'prazo fatal', 'fiscalização', 'autuação'].some((item) => normalized.includes(item))) {
    return 'alta';
  }
  if (['hoje', 'amanhã', 'amanha', 'vence', 'prazo'].some((item) => normalized.includes(item))) {
    return 'média';
  }
  return 'baixa';
}

function extractPeriod(context = {}, message = '') {
  return (
    context.periodo_referencia ||
    context.periodo ||
    message.match(/\b\d{2}\/\d{4}\b/)?.[0] ||
    message.match(/\b\d{4}-\d{2}\b/)?.[0] ||
    message.match(/\b\d{4}\b/)?.[0] ||
    null
  );
}

function buildIntake({ message, context = {} }) {
  const identifiers = extractIdentifiers(message, context);
  const rawIdentifier = digitsOnly(context.cnpj_cpf || context.cnpj || context.cpf || message.match(/\b\d{11,14}\b/)?.[0] || '');
  const documents = normalizeDocuments(context.documentos || context.documentos_anexados || context.attachments);
  const clientName = context.cliente || context.nome || context.razao_social || context.client_name || null;
  const serviceType = context.tipo_solicitacao || context.assunto || null;
  const period = extractPeriod(context, message);
  const desiredDeadline = context.prazo_desejado || context.deadline || null;
  const classification = scoreClassification(`${message} ${serviceType || ''}`, serviceType);
  const priority = detectPriority(`${message} ${desiredDeadline || ''}`);
  const profile = SERVICE_PROFILES[classification.topic] || SERVICE_PROFILES.fiscal;
  const issues = [];
  const missingFields = [];
  const missingDocuments = [];

  if (rawIdentifier) {
    if (rawIdentifier.length === 11 && !isValidCpf(rawIdentifier)) {
      issues.push('CPF inválido');
    } else if (rawIdentifier.length === 14 && !isValidCnpj(rawIdentifier)) {
      issues.push('CNPJ inválido');
    } else if (![11, 14].includes(rawIdentifier.length)) {
      issues.push('CNPJ/CPF em formato inválido');
    }
  }

  if (!clientName) {
    missingFields.push('nome do cliente');
  }

  if (!identifiers.cpf && !identifiers.cnpj) {
    missingFields.push('CNPJ ou CPF');
  }

  if (!serviceType && classification.confidence === 'baixa') {
    missingFields.push('tipo de solicitação');
  }

  if (['fiscal', 'contábil', 'trabalhista', 'financeiro'].includes(classification.topic) && !period) {
    missingFields.push('período de referência');
  }

  if (profile.requiredDocuments.length && documents.length === 0) {
    missingDocuments.push(...profile.requiredDocuments);
  }

  const requiresHuman = classification.mixed_topics.length > 0
    || issues.length > 0
    || ESCALATION_KEYWORDS.some((keyword) => normalizeText(`${message} ${serviceType || ''}`).includes(keyword));

  const status = issues.length
    ? 'invalid'
    : missingFields.length || missingDocuments.length
      ? 'needs_info'
      : requiresHuman
        ? 'needs_human'
        : 'complete';

  const estimatedDeadline = status === 'complete'
    ? (priority === 'alta' ? 'até 1 dia útil' : priority === 'média' ? '1 a 2 dias úteis' : 'conforme fila')
    : 'após recebimento das informações pendentes';

  const nextSteps = [];
  if (status === 'invalid') {
    nextSteps.push('Corrigir os dados inválidos antes de prosseguir.');
  } else {
    if (missingFields.length) {
      nextSteps.push(`Solicitar: ${missingFields.join(', ')}.`);
    }
    if (missingDocuments.length) {
      nextSteps.push(`Solicitar documentos: ${missingDocuments.join(', ')}.`);
    }
    if (requiresHuman) {
      nextSteps.push('Encaminhar para revisão humana.');
    }
    if (status === 'complete') {
      nextSteps.push(profile.guidance);
    }
  }

  const summary = [
    `Tema: ${classification.topic}`,
    `Status: ${status}`,
    clientName ? `Cliente: ${clientName}` : null,
    identifiers.cnpj ? `CNPJ: ${identifiers.cnpj}` : null,
    identifiers.cpf ? `CPF: ${identifiers.cpf}` : null,
    period ? `Período: ${period}` : null,
  ].filter(Boolean).join(' | ');

  return {
    summary,
    status,
    classification,
    inputs: {
      cliente: clientName,
      cnpj: identifiers.cnpj,
      cpf: identifiers.cpf,
      tipo_solicitacao: serviceType,
      periodo_referencia: period,
      documentos,
      prazo_desejado: desiredDeadline,
      mensagem_original: message,
    },
    validation: {
      issues,
      is_valid: issues.length === 0,
    },
    missing_fields: missingFields,
    missing_documents: missingDocuments,
    priority,
    responsible: profile.responsible,
    estimated_deadline: estimatedDeadline,
    next_steps: nextSteps,
    escalation: {
      required: requiresHuman || status === 'needs_human',
      reason: requiresHuman
        ? 'Pedido ambíguo, sensível ou com risco operacional/jurídico.'
        : null,
    },
    completion: {
      is_complete: status === 'complete',
      blockers: [...missingFields, ...missingDocuments, ...issues],
    },
  };
}

function buildFallbackResponse(intake) {
  const lines = [
    `Resumo: ${intake.summary}`,
    `Responsável sugerido: ${intake.responsible}`,
    `Prioridade: ${intake.priority}`,
    `Prazo estimado: ${intake.estimated_deadline}`,
  ];

  if (intake.missing_fields.length) {
    lines.push(`Pendências: ${intake.missing_fields.join(', ')}`);
  }

  if (intake.missing_documents.length) {
    lines.push(`Documentos faltantes: ${intake.missing_documents.join(', ')}`);
  }

  if (intake.escalation.required) {
    lines.push(`Encaminhamento humano: ${intake.escalation.reason}`);
  }

  if (intake.status === 'complete') {
    lines.push(`Orientação inicial: ${SERVICE_PROFILES[intake.classification.topic].guidance}`);
  }

  return lines.join('\n');
}

async function buscarCnpj(cnpj) {
  const sanitized = String(cnpj || '').replace(/\D/g, '').slice(0, 14);
  if (!isValidCnpj(sanitized)) {
    return {
      cnpj: sanitized,
      error: 'CNPJ inválido',
    };
  }

  const baseUrl = (process.env.BRASILAPI_BASE_URL || 'https://brasilapi.com.br/api/cnpj/v1').replace(/\/$/, '');
  const response = await axios.get(`${baseUrl}/${sanitized}`, { timeout: 15000 });
  return response.data;
}

function normalizeCompany(data = {}) {
  const activity = data.atividade_principal || data.main_activity || data.cnae_fiscal || null;
  const porte = data.porte || null;

  return {
    cnpj: String(data.cnpj || data.numero_de_inscricao || '').replace(/\D/g, '').slice(0, 14),
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

function analyzeRegime(company) {
  const text = [
    company?.regime_tributario,
    company?.porte,
    company?.atividade_principal?.texto,
    company?.natureza_juridica,
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

  if (company?.situacao_cadastral && !/ativa|ativo|regular/i.test(company.situacao_cadastral)) {
    alerts.push(`Situação cadastral não ativa: ${company.situacao_cadastral}`);
  }

  const statusApi = process.env.FISCAL_STATUS_API_URL;
  const certidaoApi = process.env.FISCAL_CERTIDAO_API_URL;

  const externalChecks = [];
  if (statusApi && company?.cnpj) {
    externalChecks.push(
      axios.get(`${statusApi.replace(/\/$/, '')}/${company.cnpj}`, { timeout: 15000 })
        .then((response) => ({ source: 'status_api', data: response.data }))
        .catch((error) => ({ source: 'status_api', error: error.message }))
    );
  }

  if (certidaoApi && company?.cnpj) {
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

async function chat({ message, user, context = {} }) {
  const intake = buildIntake({ message, context });
  const messageText = String(message || '').trim();
  const cnpj = intake.inputs.cnpj;

  let company = null;
  let regime = { regime_estimado: 'Indeterminado', justificativa: ['Nenhum CNPJ informado.'] };
  let situacao = { status: 'nao_avaliada', alertas: [], fontes_consultadas: [] };
  let matchingSearches = { results: [] };

  if (cnpj) {
    company = await buscarCnpj(cnpj).catch((error) => ({ cnpj, error: error.message }));
    if (company && !company.error) {
      company = normalizeCompany(company);
      regime = analyzeRegime(company);
      situacao = await verificarSituacaoFiscal(company).catch((error) => ({ status: 'erro', alertas: [error.message], fontes_consultadas: [] }));
      matchingSearches = await buscarEmpresasPorPerfil({ userId: user?.id, perfil: context.perfil || {}, limit: 5 }).catch(() => ({ results: [] }));
    }
  }

  const structured = {
    ...intake,
    company,
    regime,
    situacao,
    matchingSearches: matchingSearches.results || [],
  };

  const report = company && !company.error
    ? gerarRelatorioFiscal({ company, regime, situacao, matchingSearches: matchingSearches.results || [] })
    : null;

  const shouldUseLlm = structured.status === 'complete' && Boolean(messageText);
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Pedido original: ${messageText}` },
    { role: 'assistant', content: JSON.stringify(structured, null, 2) },
  ];

  const llmAnswer = shouldUseLlm ? await callLlm(messages).catch(() => null) : null;
  const answer = llmAnswer || buildFallbackResponse(structured);

  return {
    answer,
    ...structured,
    report,
  };
}

async function analyze({ cnpjs = [], user } = {}) {
  const normalized = [...new Set(cnpjs.map((item) => String(item || '').replace(/\D/g, ''))).values()];
  const analyses = [];

  for (const identifier of normalized) {
    if (identifier.length === 11) {
      analyses.push({
        cpf: identifier,
        validation: {
          is_valid: isValidCpf(identifier),
          issues: isValidCpf(identifier) ? [] : ['CPF inválido'],
        },
        report: {
          summary: {
            cpf: identifier,
            tipo: 'CPF',
            status: isValidCpf(identifier) ? 'válido' : 'inválido',
          },
          markdown: `# Validação de CPF\n**CPF:** ${identifier}\n**Status:** ${isValidCpf(identifier) ? 'válido' : 'inválido'}`,
        },
      });
      continue;
    }

    const cnpj = identifier.slice(0, 14);
    if (!isValidCnpj(cnpj)) {
      analyses.push({
        cnpj,
        validation: {
          is_valid: false,
          issues: ['CNPJ inválido'],
        },
        report: {
          summary: {
            cnpj,
            tipo: 'CNPJ',
            status: 'inválido',
          },
          markdown: `# Validação de CNPJ\n**CNPJ:** ${cnpj}\n**Status:** inválido`,
        },
      });
      continue;
    }

    const company = await buscarCnpj(cnpj).catch((error) => ({ cnpj, error: error.message }));
    const normalizedCompany = company && !company.error ? normalizeCompany(company) : company;
    const regime = analyzeRegime(normalizedCompany);
    const situacao = await verificarSituacaoFiscal(normalizedCompany).catch((error) => ({ status: 'erro', alertas: [error.message], fontes_consultadas: [] }));
    const report = gerarRelatorioFiscal({ company: normalizedCompany, regime, situacao });

    analyses.push({
      cnpj,
      company: normalizedCompany,
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
  SERVICE_PROFILES,
  digitsOnly,
  isValidCpf,
  isValidCnpj,
  extractIdentifiers,
  normalizeDocuments,
  buildIntake,
  buscarCnpj,
  analyzeRegime,
  verificarSituacaoFiscal,
  buscarEmpresasPorPerfil,
  gerarRelatorioFiscal,
  chat,
  analyze,
  saveConversation,
};
