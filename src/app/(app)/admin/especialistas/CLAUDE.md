# `/admin/especialistas` — Especialistas Directscal

Lista e cadastro de profissionais internos que podem receber empresas e preparar relatórios e action points.

## Convenções locais

- Especialista é um papel interno e não deve receber o papel técnico `superadmin`.
- Cadastro usa drawer lateral e mantém a pessoa ativa por padrão.
- A tabela comunica capacidade por empresas e entregas em andamento.
- O status ativo/inativo é controlado diretamente por switch na tabela; desativar bloqueia novas atribuições sem remover as entregas atuais.
- O menu contextual permite arquivar, restaurar e excluir. Exclusão exige confirmação explícita.
- O nome do especialista e a ação `Editar perfil` abrem um drawer compacto com foto, dados profissionais e capacidade atual.
- A foto aceita JPG, PNG ou WebP de até 5 MB, pode ser removida e aparece imediatamente no avatar da tabela após salvar.
- Nesta primeira versão, inclusões, status, arquivamento, exclusão e fotos permanecem apenas no estado local da página.
