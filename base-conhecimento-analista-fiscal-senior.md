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

# 9) Matriz completa de CFOP por tipo de operação

## 9.1 Compra para revenda / comercialização
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Compra para revenda dentro do estado | 5.102 | 1.102 | Mercadoria para revenda |
| Compra para revenda interestadual | 6.102 | 2.102 | Fornecedor de outro estado |
| Mercadoria com ST | 5.405 / 6.405 | 1.405 / 2.405 | Produto sujeito à ST |
| Mercadoria recebida com ST já retida | 5.403 / 6.403 | 1.403 / 2.403 | Revenda com ST já encerrada |

## 9.2 Compra para industrialização
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Compra para industrialização dentro do estado | 5.101 | 1.101 | Matéria-prima |
| Compra para industrialização interestadual | 6.101 | 2.101 | Insumo industrial |

## 9.3 Uso e consumo
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Compra para uso/consumo dentro do estado | 5.556 | 1.556 | Material de escritório |
| Compra para uso/consumo interestadual | 6.556 | 2.556 | Material de limpeza |

## 9.4 Ativo imobilizado
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Compra de bem para ativo dentro do estado | 5.551 | 1.551 | Máquina ou veículo |
| Compra de bem para ativo interestadual | 6.551 | 2.551 | Equipamento importado de outro estado |

## 9.5 Devolução de compra
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Devolução de compra para revenda | 5.201 / 6.201 | 1.201 / 2.201 | Mercadoria devolvida |
| Devolução de compra para industrialização | 5.202 / 6.202 | 1.202 / 2.202 | Insumo devolvido |

## 9.6 Remessa para industrialização
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Remessa para industrialização dentro do estado | 5.901 | 1.901 | Envio de insumo a terceiro |
| Remessa para industrialização interestadual | 6.901 | 2.901 | Envio fora do estado |
| Retorno de industrialização | 5.902 / 6.902 | 1.902 / 2.902 | Produto industrializado retorna |
| Retorno de insumo não aplicado | 5.903 / 6.903 | 1.903 / 2.903 | Sobra de matéria-prima retorna |

## 9.7 Consignação
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Remessa em consignação | 5.917 / 6.917 | 1.917 / 2.917 | Envio para venda futura |
| Retorno de consignação | 5.918 / 6.918 | 1.918 / 2.918 | Mercadoria não vendida retorna |

## 9.8 Transferências
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Transferência dentro do estado | 5.151 | 1.151 | Filial para filial no mesmo estado |
| Transferência interestadual | 6.151 | 2.151 | Filial em SP para filial em MG |

## 9.9 Faturamento antecipado / entrega futura
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Faturamento antecipado | 5.922 / 6.922 | 1.922 / 2.922 | Venda antes da entrega física |

## 9.10 Comodato / empréstimo
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Remessa em comodato | 5.908 / 6.908 | 1.908 / 2.908 | Empréstimo de equipamento |
| Retorno de comodato | 5.909 / 6.909 | 1.909 / 2.909 | Devolução do bem emprestado |

## 9.11 Importação
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Compra no exterior para revenda | 3.102 | 3.102 | Mercadoria importada para revenda |
| Compra no exterior para industrialização | 3.101 | 3.101 | Insumo importado |
| Compra no exterior para uso/consumo | 3.556 | 3.556 | Material de consumo importado |
| Compra no exterior para ativo | 3.551 | 3.551 | Máquina importada |

## 9.12 Exportação
| Natureza | CFOP no XML (saída) | CFOP na entrada | Exemplo |
|---|---:|---:|---|
| Exportação de mercadoria | 7.101 | não se aplica como entrada comum | Venda ao exterior |
| Exportação de produção própria | 7.101 | não se aplica | Produto exportado |

## 9.13 Serviços com CFOP
> ISS puro não usa CFOP. Para ISS, o correto é código de serviço municipal / NFS-e.

### Transporte
| Operação | CFOP interno | CFOP interestadual | Exemplo |
|---|---:|---:|---|
| Prestação de serviço de transporte | 5.351 a 5.359 | 6.351 a 6.359 | Frete rodoviário de carga |

### Comunicação
| Operação | CFOP interno | CFOP interestadual | Exemplo |
|---|---:|---:|---|
| Prestação de serviço de comunicação | 5.301 a 5.307 | 6.301 a 6.307 | Telefonia, dados, telecom |

## 9.14 Operações especiais
### Remessa para depósito / armazém geral
| Operação | CFOP interno | CFOP interestadual | Exemplo |
|---|---:|---:|---|
| Remessa para depósito fechado / armazém geral | 5.905 | 6.905 | Envio para armazenagem |
| Retorno de depósito | 5.906 | 6.906 | Mercadoria volta ao estabelecimento |

### Demonstração / mostruário / feiras
| Operação | CFOP | Exemplo |
|---|---:|---|
| Remessa para demonstração | 5.912 / 6.912 | Mercadoria para apresentação comercial |
| Retorno de demonstração | 5.913 / 6.913 | Mercadoria retorna após demonstração |
| Remessa para mostruário / exposição | 5.914 / 6.914 | Uso em evento ou feira |

### Conserto / reparo
| Operação | CFOP | Exemplo |
|---|---:|---|
| Remessa para conserto ou reparo | 5.915 / 6.915 | Equipamento enviado para assistência |
| Retorno do conserto | 5.916 / 6.916 | Bem retorna após reparo |

### Venda à ordem / entrega por conta e ordem
| Operação | CFOP | Exemplo |
|---|---:|---|
| Venda à ordem | 5.118 / 6.118 | Operação triangular |

### Outras saídas
| Operação | CFOP | Exemplo |
|---|---:|---|
| Outras saídas não especificadas | 5.949 / 6.949 | Fallback quando não há código específico |

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
