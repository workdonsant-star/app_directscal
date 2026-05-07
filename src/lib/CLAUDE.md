# `src/lib` — Types, mock data e utilidades

Antes de editar, releia o **AGENTS.md** da raiz e este documento.

## Propósito

`src/lib` concentra **tipos compartilhados, dados mockados e utilidades neutras** ao framework. Nada aqui depende de React, Next ou DOM — exceto `utils.ts` que é puramente helper de classes Tailwind.

## Arquivos

```
src/lib/
├── mock-data.ts     ← dimensões, diagnósticos, KPIs e função classifyScore
├── types.ts         ← tipos de domínio (Diagnostic, Dimension, RespondentGroup, …)
└── utils.ts         ← cn() (clsx + tailwind-merge)
```

## `types.ts` — fonte canônica do domínio

Os tipos aqui descrevem o **shape esperado da API real** quando ela chegar. Ao alterá-los:
- Atualize `mock-data.ts` no mesmo commit.
- Atualize componentes que dependem do tipo (TypeScript apontará).
- Não introduza tipos que só fazem sentido em mock (campos fictícios, valores hardcoded). Os tipos devem ser realistas.

Domínio coberto hoje:
- `Diagnostic` — diagnóstico criado pelo administrador.
- `Dimension` — uma das 6 dimensões avaliadas (id, número, nome, nome curto, pergunta-chave, descrição).
- `DiagnosticStatus` — `"rascunho" | "ativo" | "encerrado"`.
- `RespondentGroup` — `"fundador" | "lideranca" | "operacao"` (note: sem cedilha, sem acento — keys de dado).
- `DimensionId` — uma das 6 ids de dimensão.
- `Classification` — string literal com as 5 classificações de maturidade.

## `mock-data.ts` — dados fictícios

**Esta é a fase de mock data.** Toda interface lê daqui. Quando a API entrar, este arquivo será substituído por hooks de domínio com a mesma forma de dados.

Exporta:
- `dimensions[]` — as 6 dimensões com nomes, perguntas e descrições.
- `diagnostics[]` — 6 diagnósticos fictícios em estados variados (cobre rascunho, ativo, encerrado).
- `lastDiagnosticDimensionScores` — objeto `Record<DimensionId, number>` com os scores do último diagnóstico (alimenta o gráfico do dashboard).
- `dashboardKpis` — KPIs agregados (calculados a partir dos arrays acima).
- `classifyScore(score: number): Classification` — **única fonte** da regra de classificação.
- `getDimensionById(id)` — helper.

### Regras

- **Cálculos derivados moram aqui**, não em componente. Se uma página mostrar "score médio", calcule em `mock-data.ts` e exporte.
- **Português realista.** Nomes de empresa fictícios mas plausíveis ("Vertex Logistics", "Lumen Health"), datas absolutas (`"2026-04-22"` — nunca relativas), descrições curtas e técnicas.
- **Cobrir estados.** Pelo menos um diagnóstico em cada status (rascunho, ativo com poucas respostas, ativo com muitas, encerrado).
- **Não vaze dados pessoais reais.** Nada de e-mails verdadeiros, nomes de clientes reais, números de tickets.

### Ao adicionar novos dados mockados

1. Defina o tipo em `types.ts` primeiro.
2. Adicione o mock em `mock-data.ts`.
3. Se for derivado, exporte uma função pura — não duplique a regra em componente.
4. Atualize a tabela em `src/components/omdx/CLAUDE.md` se houver impacto de UI.

## `utils.ts` — helper único

`cn(...inputs)` combina clsx + tailwind-merge. Use sempre que compor classes condicionalmente:

```ts
import { cn } from "@/lib/utils";

<div className={cn("base", isActive && "ativo", className)} />
```

Não adicione utilidades genéricas aqui sem justificar — `lib/` deve permanecer enxuto.

## Anti-padrões

- Importar React, Next ou shadcn em `src/lib/` (exceção: `utils.ts` mexe com classes Tailwind, mas sem JSX).
- Duplicar a regra de `classifyScore` em outro arquivo.
- Mistura de seeds determinísticos com `Math.random()` no mock — mantenha tudo estático para a UI ser previsível.
- Fetches reais, server actions, chamadas a APIs. **Esta fase é 100% mockada.**
- Tipos com campos opcionais "por via das dúvidas" — modele como será de verdade.

## Quando virar API real

Manteremos a forma dos tipos. O que muda:
- `diagnostics[]` vira `useDiagnostics()` (TanStack Query ou similar).
- `dashboardKpis` vira derivação dentro de um selector ou hook.
- `classifyScore` continua aqui — é regra de domínio, não de transporte.

A meta é: **substituir a fonte sem reescrever os componentes**.
