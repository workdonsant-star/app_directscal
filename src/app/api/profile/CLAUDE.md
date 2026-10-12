# `/api/profile` — Atualização do perfil empresarial

Route Handler autenticado para persistir ajustes pessoais de `/perfil` e comerciais de `/configuracoes`.

## Regras

- PATCH usa updateProfileCommercialInputSchema para os dados comerciais. PUT usa personalProfileInputSchema estrito para nome/foto e grava somente o userId da sessão em account_profiles. PUT também permite superadmin editar a própria identidade, sem acesso aos dados empresariais.
- Derivar o usuário da sessão autenticada; nunca aceitar `userId` do navegador.
- `cliente` (Superadmin da empresa) pode atualizar nome social, posição, nicho, Instagram, website, tamanho e faturamento no lead da organização.
- `admin` só pode atualizar sua própria posição em `organization_people`; campos empresariais do payload são ignorados no servidor.
- Preservar razão social, demais dados oficiais do CNPJ e o campo de desafios.
- Usar Supabase com service role somente no servidor. Escritas empresariais exigem membership `cliente` na organização; escritas pessoais filtram por `auth_user_id`.
