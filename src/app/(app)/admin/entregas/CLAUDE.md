# Entregas — workspace da empresa em Operação

## Interface

- `/admin/entregas/[id]` redireciona para `/dados`. Links antigos com `?aba=` e `?ativo=`/`?perguntas=1` também redirecionam para a rota equivalente.
- O `layout.tsx` carrega o contexto (`loadAdminDeliveryContext`), monta o `DeliveryDraftProvider` e o `DeliveryShell`; cada etapa é uma rota própria: `dados`, `relatorio`, `action-points`, `ativos` e `publicar`. O PDF fica em `relatorio/pdf`.
- O rascunho (relatório, leituras por dimensão, action points e especialista) vive no layout e sobrevive à navegação entre etapas; salvar e publicar ficam na topbar, exceto em `/ativos`, que apresenta as próprias ações.
- Criação dos ativos usa a organização do diagnóstico aberto; trocar diagnóstico dentro da mesma empresa mantém o vínculo dos ativos por organização. Ativos têm ciclo editorial próprio e não bloqueiam a publicação da entrega.
- `ativos` lista a produção; `ativos/[assetId]` abre o editor; `ativos/perguntas` abre as perguntas da empresa. O servidor filtra ativos/auditorias e recusa editor de outra empresa com 404.
- A empresa fica bloqueada no drawer e é enviada pelo contexto da instância. Os componentes editoriais usam `embedded` para reutilizar a topbar e o recuo da instância.
- Relatório e action points preservam seus fluxos existentes e não são alterados pela publicação de um ativo.
