# `/admin/campanhas` — Campanhas de aquisição

Página operacional do superadmin para configurar campanhas, links públicos e campos do formulário de aquisição.

## Convenções locais

- Campanhas têm link público em `/a/[token]` e formulário configurável por campanha.
- Criação e edição acontecem em drawer lateral; não criar rota dedicada de campanha nesta etapa.
- Ao criar campanha, o superadmin deve escolher o módulo e definir a slug de aquisição que compõe o link público.
- A tabela de campanhas deve ficar aqui, não em `/admin/modulos`.
