# `/ativos-de-gestao/matriz-raci` — Biblioteca de Matrizes RACI

Rota autenticada que lista as matrizes de responsabilidade publicadas para a empresa.

## Convenções

- Usa `ManagementAssetsPage` com o tipo `raci`.
- Exibe busca, mas não filtro por categoria nesta primeira versão.
- A leitura individual está em `[id]`, usando o documento RichText publicado e retornando à pasta da categoria pelo breadcrumb.
