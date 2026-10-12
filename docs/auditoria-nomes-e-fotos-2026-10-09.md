# Auditoria de nomes e fotos — 09/10/2026

## Resultado

A causa da divergência entre navegadores foi confirmada no código e no Supabase conectado. O perfil pessoal escrevia nome e foto no localStorage, sem chamada ao banco. Especialistas eram uma lista fixa no código; fotos e alterações existiam somente no estado React da página. A autoria dos ativos publicados consultava essa mesma lista fixa. O JWT também mantinha nomes antigos.

A correção foi implementada no checkout local. A migração `shared_person_profiles` já foi aplicada ao Supabase conectado. Esta entrega não inclui publicação da aplicação hospedada.

## Evidência inicial

- 11 contas em next_auth.users; 11 com nome e 4 com imagem.
- Nenhuma tabela de especialistas antes da mudança.
- Nome e foto salvos em `/perfil` não eram enviados à API.
- A API existente de perfil persistia apenas posição e dados comerciais.
- A leitura do perfil também podia herdar o avatar do mock, em vez da foto da conta.

## Correções

- `account_profiles`: nome, avatar e data de atualização, com FK para a conta Auth.js. Escolhas pessoais prevalecem sobre dados Google e JWT. A conta inicial usa next_auth.users enquanto não existir perfil próprio.
- `specialists`: cadastro, nome, foto, status, arquivamento e exclusão lógica. Os quatro IDs anteriores foram preservados para manter referências. Contagens de capacidade usam as entregas reais cadastradas.
- Fotos novas são recortadas para WebP de 512 × 512 e persistidas como raster base64 no próprio banco. O transporte aceita até 1 milhão de caracteres; a coluna tem limite adicional de 7 milhões de bytes. Não há URLs blob locais nem bucket público. Referências HTTPS e caminhos de imagens existentes também são aceitos.
- `PUT /api/profile` grava exclusivamente a conta derivada da sessão. O schema não aceita userId. `PATCH /api/profile` mantém o contrato comercial anterior.
- `/api/admin/specialists` exige superadmin global; cadastrar especialista não cria acesso administrativo. Exclusão lógica preserva autorias anteriores.
- O shell, o chat, os criadores de pesquisas, as lideranças por setor, os autores publicados e os seletores administrativos consultam a identidade compartilhada. O trigger sincroniza organization_people na mesma transação do perfil.
- Ao recuperar foco, o shell e o cadastro recarregam dados; também há atualização periódica a cada minuto. Não se trata de sincronização instantânea por Realtime.
- Dados locais antigos não preenchem o perfil e não são transferidos automaticamente ao banco, inclusive antes da primeira gravação. A remoção da foto persiste null e não ressuscita a imagem anterior.

## Segurança e validação

- RLS habilitado nas duas tabelas; anon e authenticated sem grants. Somente os handlers autenticados usam service role no servidor.
- Validação recusa impersonação, campos de permissão no cadastro, URLs blob, SVG e imagens acima do limite.
- Advisors: nenhuma nova advertência de segurança. As duas tabelas geram apenas o aviso informativo esperado de RLS sem policies, pois não oferecem acesso direto ao cliente. A advertência anterior sobre search_path de omdx_question_aggregates permanece fora desta mudança.
- TypeScript e lint globais passaram; suíte completa: 34 arquivos, 146 testes aprovados. Após os ajustes finais, os testes direcionados de perfil, permissões e ativos também passaram.
- Teste contra o banco real com cadastros fictícios temporários: duas sessões independentes, gravação e leitura de nome/foto, remoção de foto, criação e atualização de especialista. Os cadastros temporários foram removidos e a limpeza foi conferida por SQL.
- Verificação visual desktop de Perfil e Especialistas em light e dark. Nenhuma página pública foi alterada.

## Limites e uso após publicação

O banco já está preparado. A aplicação hospedada só utilizará as correções após deploy deste código. Nenhuma conta real teve nome ou foto alterados durante a auditoria.

Fotos de especialistas que existiam apenas em memória e foram perdidas ao fechar a página não podem ser recuperadas. Precisam ser enviadas novamente. Nome e foto desejados devem ser editados explicitamente e salvos no perfil; valores locais antigos não são importados.

Senha simulada, atribuições legadas de empresa e outros fluxos demonstrativos não foram transformados em autenticação ou operação real por esta mudança.

## Correção complementar após captura de conflito

A compatibilidade automática com localStorage deixou uma lacuna: antes de existir account_profiles, o formulário mostrava valores antigos, enquanto a sidebar já usava a identidade do servidor. Essa leitura foi removida completamente do formulário. O teste anterior cobria valores locais antigos somente após a primeira gravação; o novo cenário verifica também a conta sem account_profiles e a igualdade de nome/foto entre formulário e sidebar. O draft reinicia ao trocar de conta.

Validação complementar: os dois cenários Playwright de profile-identity.spec.ts passaram (light/dark). O teste com duas sessões e banco real também confirmou que valores locais não são exibidos nem importados antes da primeira gravação. TypeScript e lint passaram após a correção.
