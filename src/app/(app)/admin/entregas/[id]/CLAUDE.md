# `/admin/entregas/[id]` — Workspace da entrega

Ambiente interno para interpretar dados consolidados, escrever o relatório, selecionar action points e revisar a publicação ao cliente.

## Convenções locais

- A entrega reúne relatório e action points em um único ciclo de publicação.
- Scores e gráficos são somente leitura; o especialista edita apenas a camada analítica.
- `/dados` é um redirect legado para `/relatorio`. O layout conserva o rascunho; o relatório não usa a navegação lateral nem o cabeçalho operacional.
- O relatório reúne gráficos calculados da coleta e campos vazios para a análise do especialista. O único controle da página é Salvar rascunho, após os campos. Publicação, seletor de diagnóstico, download, checklist e prévia ficam fora dessa superfície.
- Action points, ativos e publicação mantêm rotas próprias. O PDF fica em `relatorio/pdf`.
- Action points do catálogo são sugestões. Somente itens selecionados entram na publicação.
- Relatório usa seções estruturadas para manter consistência entre especialistas e permitir exportação futura.
- Dados, scores e gráficos vêm do diagnóstico real consolidado no Supabase.
- Edição, leituras por dimensão, seleção de action points, atribuição e publicação são persistidas em `public.admin_deliveries`.
- Somente a ação explícita de publicação libera a listagem, leitura e download para os membros autorizados da empresa.
- Em Ativos, `Novo ativo` pede categoria e tipo; a escolha do tipo cria a versão inicial pelo modelo padrão e abre o editor, também nesta rota de entrega.

O layout injeta SpecialistsProvider com o diretório real já lido no contexto da entrega. Provider do rascunho e shell compartilham os mesmos especialistas, sem duas consultas posteriores à montagem.
