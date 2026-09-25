# `/configuracoes` — Configurações

Página autenticada que concentra os dados empresariais da conta cliente.

## Propósito

- Separar os dados da empresa das informações pessoais exibidas em `/perfil`.
- Ler organização, CNPJ e informações de onboarding com `getProfileSettingsData()` no servidor.
- Ler setores e lideranças com `getOrganizationStructure()` e exibi-los na tabela operacional.
- Permitir editar nome fantasia e informações comerciais pelo componente `CompanySettings`.
- Manter razão social, CNPJ, cadastro oficial e desafios em estado somente leitura.

## Convenções

- A página é Server Component e delega apenas o formulário interativo ao Client Component.
- Usuários sem sessão redirecionam para `/entrar`; o `superadmin` global redireciona para `/admin/operacao` e o `admin` da empresa redireciona para `/omdx`. Somente `cliente`, apresentado como Superadmin da empresa, acessa esta página.
- Usar breadcrumb `Configurações` e `AppPage` em largura total.
- Escritas continuam em `PATCH /api/profile`, com validação de sessão e acesso ao Supabase somente no servidor.
- Cadastro e reenvio de convites passam por `/api/settings/sectors`; a organização nunca vem do navegador.
- Cada convite define `Superadmin` (`cliente`) ou `Admin` (`admin`). O primeiro possui acesso completo da empresa; o segundo não acessa Configurações nem Contratos.
- `Posição na empresa` continua em `/perfil`, por ser informação ligada à pessoa autenticada.
- O CTA `Salvar alterações` fica na topbar, imediatamente antes do sino; mensagens de retorno permanecem no formulário.
