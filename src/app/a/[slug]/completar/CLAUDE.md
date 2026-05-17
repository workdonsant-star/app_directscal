# `/a/[slug]/completar` — Completar campanha Google

## Propósito

Etapa pública autenticada por Google para completar o cadastro vindo de uma campanha. Coleta empresa e dados operacionais, cria lead/organização/membership `cliente` no Supabase e redireciona para `/omdx`.

## Convenções locais

- Usa sessão Auth.js real; cookie mockado não deve liberar esta etapa.
- Exige intent httpOnly ativo e `session.acquisition === true`; sessão corporativa antiga deve voltar para `/a/[slug]`.
- O e-mail exibido e gravado vem do Google OAuth autenticado, não de campo digitado na campanha.
- A slug da campanha precisa permanecer ativa.
- A pessoa nunca é enviada para `/admin` por este fluxo, mesmo usando e-mail corporativo da Directscal.
