# Download dos ativos de gestão

`/[type]/[id]` gera Markdown UTF-8 (`.md`) da versão publicada vigente, via helper puro `buildManagementAssetMarkdown` no runtime Node. O tipo usa o contrato de domínio (`sop`, `playbook`, `governanca`, `raci`).

O handler valida sessão e acesso cliente explicitamente, pois Route Handlers não herdam a autorização do layout. A leitura reutiliza `getManagementAssetDocument`, preservando organizações acessíveis, status publicado e ausência de arquivamento. Retorna 401 sem sessão, 403 para superadmin e 404 para tipo/ativo indisponível. Respostas privadas usam `Cache-Control: no-store`; o arquivo é enviado como attachment. Não grava arquivos nem altera dados.

A exportação preserva metadados, títulos, marcas, links, listas aninhadas, destaques e tabelas simples GFM. Texto literal tem caracteres Markdown/HTML escapados. Tabelas sem cabeçalho recebem uma linha de cabeçalho vazia para preservar todas as linhas como dados.
