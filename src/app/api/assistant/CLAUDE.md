# `/api/assistant` — Agente de consulta no app

- `ask` (`POST { question }`): exige sessão de cliente (`cliente` ou `admin`), resolve a organização principal da pessoa e chama `answerAssetQuestion()` com `channel: "app"`.
- `feedback` (`POST { auditId, value, comment? }`): grava ou substitui a avaliação da própria pessoa; respostas de outra pessoa ou de outra empresa retornam 404.
- `superadmin` não usa estas rotas: o papel não tem escopo de cliente.


A17: history GET aceita somente cursor, sem cache, exige sessão definitiva e devolve consultas próprias do app na empresa atual. Fontes armazenadas são validadas e href é derivado de tipo/ativo, nunca reutilizado de URL arbitrária.


A17: ask declara maxDuration=180 para não encerrar a função antes do orçamento já existente de embedding (30 s), resposta (45 s) e retry (45 s), além de busca/auditoria. Não altera timeouts dos provedores nem garante esse limite no host; confirmar duração aceita e latência/SLA no deploy. Falha do provedor permanece erro, sem ser convertida em resposta ou recusa de conteúdo.
