# `/api/assistant` — Agente de consulta no app

- `ask` (`POST { question }`): exige sessão de cliente (`cliente` ou `admin`), resolve a organização principal da pessoa e chama `answerAssetQuestion()` com `channel: "app"`.
- `feedback` (`POST { auditId, value, comment? }`): grava ou substitui a avaliação da própria pessoa; respostas de outra pessoa ou de outra empresa retornam 404.
- `superadmin` não usa estas rotas: o papel não tem escopo de cliente.
