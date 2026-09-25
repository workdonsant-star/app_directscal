# `/api/profile` — Atualização do perfil empresarial

Route Handler autenticado para persistir ajustes pessoais de `/perfil` e comerciais de `/configuracoes`.

## Regras

- Aceitar somente `PATCH` com `updateProfileCommercialInputSchema`.
- Derivar o usuário da sessão autenticada; nunca aceitar `userId` do navegador.
- `cliente` (Superadmin da empresa) pode atualizar nome social, posição, nicho, Instagram, website, tamanho e faturamento no lead da organização.
- `admin` só pode atualizar sua própria posição em `organization_people`; campos empresariais do payload são ignorados no servidor.
- Preservar razão social, demais dados oficiais do CNPJ e o campo de desafios.
- Usar Supabase com service role somente no servidor. Escritas empresariais exigem membership `cliente` na organização; escritas pessoais filtram por `auth_user_id`.
