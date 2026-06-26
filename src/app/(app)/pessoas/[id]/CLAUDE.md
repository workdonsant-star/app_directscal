# `src/app/(app)/pessoas/[id]` — Perfil da pessoa

Perfil individual do módulo Pessoas.

## Regras

- `params` é assíncrono no Next.js 16 e deve ser aguardado.
- O perfil é a fonte primária de vínculo, remuneração, documentos, papéis e pagamentos da pessoa.
- Se o ID não existir no data-source da organização, retornar `notFound()`.
