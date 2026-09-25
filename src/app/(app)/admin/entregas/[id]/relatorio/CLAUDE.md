# `/admin/entregas/[id]/relatorio` — Download administrativo

Rota de download do PDF consolidado de uma entrega no workspace interno.

## Convenções locais

- Exige sessão com papel técnico `superadmin`.
- Reutiliza o documento PDF canônico de Maturidade.
- O relatório é resolvido pelo diagnóstico encerrado real selecionado no Supabase.
- A resposta não usa cache e força download com nome de arquivo legível.
