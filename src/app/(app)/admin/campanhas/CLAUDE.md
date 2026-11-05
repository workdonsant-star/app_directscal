# `/admin/campanhas` — Campanhas de aquisição

Página operacional do superadmin para configurar campanhas, links públicos e campos do formulário de aquisição.

## Convenções locais

- Campanhas têm link público em `/a/[slug]` e formulário configurável por campanha.
- Criação e edição acontecem em drawer lateral; não criar rota dedicada de campanha nesta etapa.
- Ao criar campanha, o superadmin deve escolher o módulo e definir a slug de aquisição que compõe o link público.
- A tabela de campanhas deve ficar aqui, não em `/admin/modulos`.
- A página valida sessão definitiva de superadmin antes de ler o snapshot no servidor. KPIs e tabela recebem o mesmo snapshot real na primeira renderização; nunca usar as campanhas seed como carregamento ou fallback de erro.
- `loading.tsx` usa skeletons dos indicadores e da tabela durante a leitura; `error.tsx` oferece nova tentativa sem expor detalhes internos. Lista vazia tem mensagem explícita.
- O cliente reutiliza o snapshot inicial sem repetir a busca ao montar; criação/edição continuam atualizando pela API no evento administrativo.
