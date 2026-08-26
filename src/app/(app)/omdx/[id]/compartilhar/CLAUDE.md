# `/omdx/[id]/compartilhar` — Central de coleta

## Propósito

Camada abaixo da área de diagnósticos para compartilhar os links públicos de Maturidade por grupo organizacional e acompanhar a coleta de forma compacta.

## Convenções locais

- Deve usar breadcrumb: `Maturidade / Diagnósticos / Compartilhar`.
- Mostrar links separados para fundador, liderança e operação.
- Mostrar mensagem sugerida por grupo e prévia pública em `/r/[token]`.
- Mostrar resumo compacto de respostas; lista detalhada de respondentes fica para acompanhamento futuro.
<<<<<<< Updated upstream
- Liberar análise e downloads quando houver pelo menos uma resposta de Fundador; liderança e operação aparecem como sem base até responderem.
=======
- Liberar análise e downloads de relatório PDF/CSV quando houver pelo menos uma resposta de Fundador; liderança e operação aparecem como sem base até responderem.
- Liberar `Baixar respostas CSV` quando houver ao menos uma resposta, mantendo a exportação bruta anônima.
>>>>>>> Stashed changes
- Clipboard continua client-side; encerramento de coleta é persistido pela API Maturidade.
- A rota parte do contexto de `/omdx/diagnosticos`, não do dashboard raiz.
- Usar `AppPage` com o mesmo recuo horizontal de Dimensões e conteúdo em largura total.
