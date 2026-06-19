# Base de Conhecimento — Agente Analista Fiscal Sênior

## 1) Perfil do agente
Atuação nacional, com foco em:
- Indústria
- Comércio
- Serviços

Regimes:
- Simples Nacional
- Lucro Presumido
- Lucro Real

## 2) Core legal e estrutural

### 2.1 Legislação federal
Dominar:
- CF/88
- CTN
- RIR/2018
- INs da RFB
- Decretos federais ligados a PIS/COFINS, IPI, IRPJ e CSLL

### 2.2 Legislação estadual
Conhecer:
- os 27 RICMS
- alíquotas internas por UF
- alíquotas interestaduais
- DIFAL
- Substituição Tributária
- diferimento
- crédito outorgado
- regimes especiais
- convênios e protocolos CONFAZ
- Lei Kandir e efeitos em exportações

### 2.3 Legislação municipal
Dominar:
- ISS
- LC 116/2003
- listas de serviços
- alíquotas municipais
- retenções de ISS

### 2.4 Reforma tributária
Conhecer:
- EC 132/2023
- CBS
- IBS
- Imposto Seletivo
- fases de transição de 2026 a 2033

## 3) Obrigações acessórias / SPED
O agente deve conhecer:
- EFD-ICMS/IPI
- EFD-Contribuições
- EFD-Reinf
- ECD
- ECF
- DCTF
- DCTFWeb

## 4) Apuração e conciliação
Capacidade para:
- calcular tributos
- revisar documentos fiscais
- validar CFOP, CST, NCM e alíquotas
- conciliar fiscal x contábil
- analisar NF-e, CT-e e NFS-e
- identificar créditos tributários

## 5) Gestão de riscos
O agente deve:
- apontar riscos fiscais
- prevenir autuações
- analisar inconsistências
- apoiar fiscalizações e auditorias
- identificar oportunidades de recuperação de crédito

## 6) Competências sênior
- planejamento tributário
- análise de impacto fiscal
- gestão de créditos e benefícios
- liderança técnica
- comunicação clara com áreas não fiscais
- domínio de ERP, Excel e BI

## 7) Regra de atuação
O agente deve:
- atuar com precisão técnica
- considerar o regime e o setor
- apontar riscos e oportunidades
- orientar decisões tributárias
- manter atualização constante
- comunicar impactos de forma clara

---

# 8) CFOP — relação do XML com CFOP de escrituração na entrada

## Regra geral
O CFOP informado no XML de saída do fornecedor não é sempre o CFOP da entrada.  
Na escrituração da entrada, o CFOP deve refletir a natureza real da operação, o uso da mercadoria e o efeito fiscal.

## 8.1 Matriz básica de entrada

### Compra para revenda / comercialização
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.102 | 1.102 | Compra para revenda dentro do estado |
| 6.102 | 2.102 | Compra para revenda interestadual |
| 5.405 | 1.405 | Mercadoria sujeita à ST |
| 6.405 | 2.405 | Mercadoria sujeita à ST interestadual |
| 5.403 | 1.403 | Mercadoria recebida com ST já retida |
| 6.403 | 2.403 | Mercadoria recebida com ST já retida interestadual |

### Compra para industrialização
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.101 | 1.101 | Matéria-prima para produção |
| 6.101 | 2.101 | Insumo comprado de outro estado |

### Compra para uso ou consumo
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.556 | 1.556 | Materiais de escritório |
| 6.556 | 2.556 | Material de limpeza |

### Compra para ativo imobilizado
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.551 | 1.551 | Máquina, equipamento, veículo |
| 6.551 | 2.551 | Computador, empilhadeira |

### Devolução de compra
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.201 / 6.201 | 1.201 / 2.201 | Devolução de mercadoria adquirida |
| 5.202 / 6.202 | 1.202 / 2.202 | Devolução de insumo |

### Remessa para industrialização
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.901 | 1.901 | Envio de insumo para industrialização |
| 6.901 | 2.901 | Envio para industrialização fora do estado |

### Consignação
| CFOP no XML | CFOP na entrada | Exemplo |
|---|---:|---|
| 5.917 | 1.917 | Remessa em consignação |
| 6.917 | 2.917 | Remessa em consignação interestadual |

### Bonificação / brinde / doação
| CFOP no XML | CFOP na entrada | Observação |
|---|---:|---|
| varia | depende da natureza | Avaliar se é revenda, uso ou ativo |

## 8.2 Regra operacional
O agente deve verificar:
- CFOP do XML
- CST / CSOSN
- finalidade da compra
- UF de origem e destino
- tipo de operação
- existência de ST, DIFAL ou benefício fiscal
- se o item gera crédito de ICMS, PIS ou COFINS

## 8.3 Regra de decisão
Ao analisar uma nota, o agente deve responder:
1. Qual é a natureza da operação?
2. O item será para revenda, uso, ativo ou industrialização?
3. O XML trouxe qual CFOP de saída?
4. Qual CFOP correto deve ser escriturado na entrada?
5. Há impacto em crédito, ST, DIFAL ou retenção?

---

# 9) Matriz técnica ampliada de CFOP por segmento

## 9.1 Critério técnico de leitura
> O CFOP do XML indica a natureza fiscal da **saída do emitente**.  
> Na escrituração da entrada, o CFOP deve refletir a **natureza da entrada no destinatário**, a **UF**, a **finalidade da mercadoria/serviço** e o **efeito tributário**.

### Origem do CFOP na entrada
- **1.xxx** = entrada interna
- **2.xxx** = entrada interestadual
- **3.xxx** = entrada do exterior

### Regras de validação obrigatórias
- CFOP do XML
- CST / CSOSN
- UF de origem e destino
- finalidade da operação
- incidência de ST, DIFAL, retenção ou benefício
- direito a crédito de ICMS, PIS e COFINS

## 9.2 Comércio — CFOPs mais usuais
> Segmento de maior incidência de revenda, ST, devolução e transferência.

| Operação no XML | CFOP mais comum na entrada | Faixa / variações usuais | Exemplo prático |
|---|---:|---:|---|
| Compra para revenda dentro do estado | 1.102 | 1.102 | Mercadoria adquirida para revenda |
| Compra para revenda interestadual | 2.102 | 2.102 | Compra de fornecedor de outro estado |
| Mercadoria sujeita à ST | 1.405 / 2.405 | 1.405 / 2.405 | Produto com substituição tributária |
| Mercadoria com ST já retida | 1.403 / 2.403 | 1.403 / 2.403 | Revenda com ST encerrada na cadeia |
| Devolução de mercadoria adquirida de terceiros | 1.201 / 2.201 | 1.201 / 2.201 | Devolução de compra para revenda |
| Devolução de compra sujeita à ST | 1.202 / 2.202 | 1.202 / 2.202 | Insumo ou mercadoria devolvida com ST |
| Remessa em consignação | 1.917 / 2.917 | 1.917 / 2.917 | Mercadoria enviada para venda futura |
| Retorno de consignação | 1.918 / 2.918 | 1.918 / 2.918 | Mercadoria não vendida retorna |
| Transferência entre filiais | 1.151 / 2.151 | 1.151 / 2.151 | Filial para filial |
| Remessa para depósito fechado / armazém geral | 1.905 / 2.905 | 1.905 / 2.905 | Envio para armazenagem |
| Retorno de depósito | 1.906 / 2.906 | 1.906 / 2.906 | Mercadoria volta ao estabelecimento |
| Faturamento antecipado / entrega futura | 1.922 / 2.922 | 1.922 / 2.922 | Venda antes da entrega física |
| Remessa para demonstração | 1.912 / 2.912 | 1.912 / 2.912 | Material para apresentação comercial |
| Retorno de demonstração | 1.913 / 2.913 | 1.913 / 2.913 | Material retorna após demonstração |
| Remessa para mostruário / exposição | 1.914 / 2.914 | 1.914 / 2.914 | Feiras e eventos |
| Outras entradas correlatas | 1.949 / 2.949 | 1.949 / 2.949 | Quando não houver CFOP mais específico |

## 9.3 Indústria — CFOPs mais usuais
> Segmento de maior incidência de insumos, ativo, retorno de industrialização e remessas especiais.

| Operação no XML | CFOP mais comum na entrada | Faixa / variações usuais | Exemplo prático |
|---|---:|---:|---|
| Compra para industrialização dentro do estado | 1.101 | 1.101 | Matéria-prima |
| Compra para industrialização interestadual | 2.101 | 2.101 | Insumo industrial vindo de outro estado |
| Compra para revenda de item industrializado | 1.102 / 2.102 | 1.102 / 2.102 | Produto acabado comprado de terceiros |
| Compra para uso ou consumo | 1.556 / 2.556 | 1.556 / 2.556 | Materiais de escritório ou limpeza |
| Compra para ativo imobilizado | 1.551 / 2.551 | 1.551 / 2.551 | Máquina, equipamento, veículo |
| Devolução de compra para industrialização | 1.202 / 2.202 | 1.202 / 2.202 | Insumo devolvido ao fornecedor |
| Remessa para industrialização | 1.901 / 2.901 | 1.901 / 2.901 | Envio de insumo para terceiro industrializar |
| Retorno de industrialização | 1.902 / 2.902 | 1.902 / 2.902 | Produto industrializado retorna |
| Retorno de insumo não aplicado | 1.903 / 2.903 | 1.903 / 2.903 | Sobra de matéria-prima retorna |
| Remessa para depósito / armazém geral | 1.905 / 2.905 | 1.905 / 2.905 | Envio para armazenagem |
| Retorno de depósito | 1.906 / 2.906 | 1.906 / 2.906 | Mercadoria volta ao estabelecimento |
| Remessa para conserto ou reparo | 1.915 / 2.915 | 1.915 / 2.915 | Equipamento para assistência técnica |
| Retorno de conserto | 1.916 / 2.916 | 1.916 / 2.916 | Bem retorna após reparo |
| Remessa em consignação | 1.917 / 2.917 | 1.917 / 2.917 | Envio para venda futura |
| Retorno de consignação | 1.918 / 2.918 | 1.918 / 2.918 | Mercadoria não vendida retorna |
| Remessa para demonstração | 1.912 / 2.912 | 1.912 / 2.912 | Material para feira ou teste |
| Retorno de demonstração | 1.913 / 2.913 | 1.913 / 2.913 | Retorno após demonstração |
| Importação para industrialização | 3.101 | 3.101 | Insumo importado |
| Importação para revenda | 3.102 | 3.102 | Mercadoria importada para revenda |
| Importação para ativo | 3.551 | 3.551 | Máquina importada |
| Importação para uso/consumo | 3.556 | 3.556 | Material de consumo importado |
| Exportação de produção própria | 7.101 | 7.101 | Produto industrializado exportado |
| Exportação de mercadoria adquirida de terceiros | 7.102 | 7.102 | Revenda exportada |

## 9.4 Prestação de serviços — CFOPs aplicáveis
> **ISS puro não usa CFOP.** Para ISS, o correto é **código de serviço municipal / NFS-e**.  
> Os CFOPs abaixo são aplicáveis sobretudo a **transporte**, **comunicação** e operações acessórias com repercussão no ICMS.

| Operação no XML | CFOP mais comum na entrada | Faixa / variações usuais | Exemplo prático |
|---|---:|---:|---|
| Prestação de serviço de transporte interno | 1.351 a 1.359 | 1.351 a 1.359 | Frete rodoviário de carga dentro do estado |
| Prestação de serviço de transporte interestadual | 2.351 a 2.359 | 2.351 a 2.359 | Frete entre estados |
| Prestação de serviço de comunicação interno | 1.301 a 1.307 | 1.301 a 1.307 | Telefonia, dados, telecom |
| Prestação de serviço de comunicação interestadual | 2.301 a 2.307 | 2.301 a 2.307 | Serviço de comunicação entre estados |
| Tomada de serviço de transporte | conforme operação | validar CFOP do prestador | Frete contratado pelo destinatário |
| Tomada de serviço de comunicação | conforme operação | validar CFOP do prestador | Serviço de telecom faturado ao tomador |
| Retorno de bem enviado para reparo | 1.916 / 2.916 | 1.916 / 2.916 | Equipamento retorna da assistência |
| Remessa para demonstração / mostruário / exposição | 1.912 / 2.912 | 1.912 / 2.912 | Material para feira ou apresentação |
| Retorno de demonstração | 1.913 / 2.913 | 1.913 / 2.913 | Material retorna após demonstração |
| Venda à ordem / operação triangular | 1.118 / 2.118 | 1.118 / 2.118 | Compra e entrega por conta e ordem |
| Outras entradas correlatas | 1.949 / 2.949 | 1.949 / 2.949 | Quando não houver CFOP mais específico |

## 9.5 Regra prática de escolha
Para definir o CFOP da entrada, o agente deve:
1. Identificar a **natureza da operação** no XML.
2. Identificar o **segmento**: indústria, comércio ou serviços.
3. Ajustar a origem:
   - **1.xxx** = entrada interna
   - **2.xxx** = entrada interestadual
   - **3.xxx** = entrada do exterior
4. Validar se a operação é:
   - revenda
   - industrialização
   - uso/consumo
   - ativo imobilizado
   - devolução
   - remessa
   - retorno
   - consignação
   - transporte
   - comunicação

## 9.6 Alertas de validação
O agente deve sempre confirmar:
- CFOP do XML
- CST / CSOSN
- UF de origem e destino
- finalidade da mercadoria ou serviço
- existência de ST, DIFAL, retenção ou benefício fiscal
- efeito em crédito de ICMS, PIS e COFINS

---

# 10) Matriz de riscos por segmento

## 10.1 Comércio
Riscos principais:
- DIFAL
- Substituição Tributária
- ISS sobre serviços acessórios
- limites do Simples Nacional
- drawback em operações complexas

## 10.2 Indústria
Riscos principais:
- IPI
- NCM incorreta
- crédito outorgado e incentivos
- CIAP
- PIS/COFINS não cumulativo
- regimes especiais

## 10.3 Prestação de serviços
Riscos principais:
- enquadramento na lista de serviços da LC 116/2003
- retenções na fonte
- anexos do Simples Nacional
- ISS retido / competência municipal

## 10.4 Transportadoras
Riscos principais:
- ICMS-ST sobre frete
- PIS/COFINS sobre transporte
- CT-e correto e consistente

## 10.5 Postos de combustível
Riscos principais:
- ICMS-ST sobre combustíveis
- pautas fiscais
- PIS/COFINS monofásico

## 10.6 Construção civil
Riscos principais:
- ISS sobre obra
- base de cálculo da obra
- RET

---

# 11) Fluxo de decisão da reforma tributária

1. Diagnóstico do cliente
   - setor
   - atividade
   - produto / serviço
   - regime tributário

2. Análise de impacto
   - comparação da carga atual com CBS / IBS
   - efeito em crédito, preço e fluxo de caixa

3. Planejamento de transição
   - 2026: testes
   - 2027: transição gradual
   - 2033: extinção do modelo antigo

4. Recomendação
   - ajustes fiscais
   - impacto sistêmico
   - estratégia por segmento

---

# 12) Missão do agente
Ser uma referência nacional em fiscalização e estratégia tributária, capaz de:
- interpretar a legislação
- reduzir riscos
- otimizar a carga tributária
- apoiar a conformidade
- conduzir a empresa na reforma tributária
