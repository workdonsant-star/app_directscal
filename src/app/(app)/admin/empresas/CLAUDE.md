# `/admin/empresas` — Empresas

Lista empresas que possuem conta cliente criada no sistema.

## Convenções locais

- A página exige sessão definitiva de superadmin antes de carregar o snapshot real no servidor. Organizações são identificadas por ID e precisam ter membership `cliente`; a organização técnica e leads sem conta ficam fora da lista.
- `AdminCompaniesTable` recebe `initialSnapshot` obrigatório: nunca renderizar organizações seed enquanto o banco carrega. A primeira listagem já contém somente os registros persistidos.
- `loading.tsx` mostra skeletons sem nomes ou ações; `error.tsx` permite repetir a leitura sem apresentar empresas fictícias. A exclusão conserva confirmação e atualização pela API existente.
- Não há cadastro manual de empresa nesta etapa.
- A tabela deve permanecer densa e orientada a operação.
- Cada empresa abre um detalhe próprio em `/admin/empresas/[id]`.
- A listagem tem busca por nome e seleção para exclusão. Toda a linha abre o detalhe da empresa pelo link no nome, exceto o checkbox, que continua reservado à seleção em lote. Não há coluna ou botão de acesso. Histórico de aquisição não aparece como coluna principal.

## Produção de ativos na instância

- A instância tem entrada `Criação dos ativos`, em `/admin/empresas/[id]/criacao-dos-ativos`.
- Listagem, criação, revisão, publicação, histórico e perguntas pertencem a essa empresa. Não oferecer troca de empresa dentro da produção.
- O ID de empresa `company_<organizationId>` é resolvido no servidor e o editor verifica a propriedade do ativo antes de renderizar.
