# `src/components/role-matrix` — Legado inativo da matriz de papéis

## Propósito

Componentes legados da matriz de papéis dentro da antiga funcionalidade Ativos de gestão. A superfície não é exibida na navegação e a rota antiga redireciona para `/omdx`; mantenha estes componentes sem entrada ativa até nova decisão explícita.

## Convenções locais

- A fase atual é legado inativo; dados estáticos podem ficar próximos do componente enquanto não houver reativação do produto.
- Não importar estes componentes em páginas ativas sem reabrir a decisão de produto de Ativos de gestão.
- Preserve o vocabulário operacional: papéis, responsabilidades, autonomia, critérios e alçada. Evite linguagem de RH.
- A matriz deve funcionar como ferramenta de entrega, com densidade e espaço próximos ao cronograma: cabeçalho compacto, painel esquerdo fixo e grade rolável.
- Use tokens semânticos, Lucide e primitives do sistema. Não importe `mock-data.ts`.
- Quando conectar à Directscal IA, a IA deve gerar conteúdo dentro da estrutura da matriz; o sistema continua dono dos campos e estados.
