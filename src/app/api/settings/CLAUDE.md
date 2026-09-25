# `/api/settings` — Estrutura da empresa

Route Handlers autenticados usados pela página `/configuracoes` para setores, lideranças e convites.

## Regras

- A organização sempre é derivada da sessão e de `getProfileSettingsData()`; nunca aceitar `organizationId` do navegador.
- Somente o papel técnico `cliente`, exibido como Superadmin da empresa, pode criar ou reenviar convites.
- Validar payloads com os contratos Zod de `organization-structure.ts`.
- Escritas usam service role somente no servidor.
- A criação de setor, pessoa, vínculo de liderança e convite é transacional no banco.
- Falha no provedor de e-mail mantém o cadastro e o convite como `falhou`, permitindo reenvio sem duplicar o setor.
- O convite persiste `cliente` ou `admin`; o `superadmin` global é inválido neste fluxo. O membership do painel é criado apenas no aceite Google transacional.
