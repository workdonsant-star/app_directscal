# `/docs` — Documentação de Maturidade

Página autenticada de recurso para orientar o cliente administrador no uso do sistema.

## Propósito

- Funcionar como manual prático do produto, não como documentação técnica interna.
- Explicar onde cada área fica, para que serve e como operar o fluxo Maturidade de ponta a ponta.
- Consolidar orientação operacional e conceitual de Maturidade em uma única página de documentação.

## Convenções

- Como página raiz, não exibir breadcrumb.
- Manter a página como Server Component; não usar `"use client"` sem interação real.
- A página pertence à aplicação do cliente e redireciona `superadmin` para `/admin/operacao`.
- Manter formato de página única com sumário lateral e âncoras internas.
- O sumário lateral pode usar `DocumentTableOfContents` como client component para rolagem suave e item ativo.
- Não criar rotas filhas nesta fase.
- Links finais podem apontar para `/omdx`, `/omdx/diagnosticos` e páginas de insights.

- Sumário lateral alinhado ao topo da coluna documental, sem padding superior; sticky usa `top-8` (32px), acompanhando o recuo do conteúdo no scroll interno do shell.

- Criação em tela única (informações e lideranças), sem revisão ou salvamento de rascunho. A ativação retorna à lista de pesquisas com os links disponíveis.

- A criação/configuração de pesquisa abre modal centralizada, com conteúdo responsivo em tela única.

- Compartilhamento é feito pela cópia dos links na tabela de Pesquisas; encerramento no menu de ações. A antiga central não existe mais.

- Prazo de resposta é obrigatório na criação e configuração da pesquisa.

C2: ProductGuide (customer) substitui o manual antigo Overview/Diagnósticos por Pesquisas, Analytics, Diagnósticos, Action Points, ativos e consulta. Explica a diferença entre rascunho editorial e atualização direta do dono. Entrada pelo link Guia de uso em /assistente.
