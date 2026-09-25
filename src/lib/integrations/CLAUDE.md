# `src/lib/integrations` — Adaptadores externos

## Propósito

Esta pasta contém integrações server-only que traduzem eventos externos para contratos internos do DirectScal. O adaptador não decide permissões de documentos: ele deve encaminhar a organização explicitamente para a camada de consulta.

## Regras

- Nunca exponha tokens, signing secrets ou a service role key ao client.
- Valide a assinatura do provedor antes de interpretar o payload.
- Mantenha o provedor como canal de entrada e saída; a fonte de verdade continua sendo o DirectScal/Supabase.
- Respostas devem citar ativo, seção e versão ou recusar quando não houver evidência.
