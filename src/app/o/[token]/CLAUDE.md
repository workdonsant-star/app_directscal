# `/o/[token]` — Formulário de pessoa

## Propósito

Página pública para uma pessoa informar seus próprios dados e sua percepção de papel na empresa.

## Convenções locais

- O token precisa estar ativo em `operational_onboarding_links`.
- O e-mail informado precisa pertencer ao domínio autorizado da organização.
- Neste MVP, e-mails fora do domínio são bloqueados com mensagem clara, não enviados para aprovação.
- O formulário deve permanecer curto: nome, e-mail corporativo, área, papel operacional, responsabilidades percebidas e participação em decisões da área.
- Após cadastro aprovado, mostrar confirmação do cadastro. Não redirecionar automaticamente para pesquisa, porque o diagnóstico de destino pode variar.
