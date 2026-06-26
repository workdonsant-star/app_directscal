# `/api/omdx/operational-members` — Cadastro público

## Propósito

Route Handler público para receber cadastros de pessoas enviados por link.

## Convenções locais

- Não exige autenticação.
- Resolve a empresa pelo token em `operational_onboarding_links`.
- Bloqueia e-mails fora do domínio autorizado neste MVP.
- Usa service role apenas no servidor e não retorna dados internos da empresa.
- Quando o cadastro é aceito, retorna apenas o resultado do cadastro. A escolha da pesquisa/diagnóstico de destino acontece fora deste endpoint.
- O link público de cadastro é copiado em `/pessoas/diretorio`; pessoas cadastradas passam a aparecer no diretório do módulo Pessoas.
