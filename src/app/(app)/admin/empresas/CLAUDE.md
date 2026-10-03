# `/admin/empresas` — Empresas

Lista empresas derivadas dos leads capturados.

## Convenções locais

- Empresas são agrupadas por nome a partir dos leads.
- Não há cadastro manual de empresa nesta etapa.
- A tabela deve permanecer densa e orientada a operação.
- Cada empresa abre um detalhe próprio em `/admin/empresas/[id]`.
- A listagem antecipa especialista e estado da entrega atual sem esconder a aquisição existente.

## Produção de ativos na instância

- A instância tem entrada `Criação dos ativos`, em `/admin/empresas/[id]/criacao-dos-ativos`.
- Listagem, criação, revisão, publicação, histórico e perguntas pertencem a essa empresa. Não oferecer troca de empresa dentro da produção.
- O ID de empresa `company_<organizationId>` é resolvido no servidor e o editor verifica a propriedade do ativo antes de renderizar.
