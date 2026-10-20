# `src/app/api/omdx` — Route Handlers Maturidade

## Propósito

Endpoints server-side para mutações reais de Maturidade em produção.

## Convenções

- Validar sessão com `getCurrentAuthSession()` nas mutações internas.
- Negar `superadmin` com `403` em toda leitura, mutação ou download interno de cliente. Endpoints públicos por token permanecem públicos e validam o token em vez da role.
- Usar Zod dos contratos antes de escrever no banco.
- Usar Supabase service role apenas no servidor.
- O fluxo público de resposta não exige autenticação, não coleta identificação pessoal e valida token, status do diagnóstico, trava por navegador e conjunto completo de perguntas do template antes de gravar.
- A deduplicação pública usa cookie `httpOnly` por token; o client usa `localStorage` apenas para estado visual local.
- Respostas devem ser curtas, em pt-BR, sem expor detalhes de banco.

- A data limite da pesquisa é inclusiva até o fim do dia em America/Sao_Paulo. `hasDiagnosticDeadlinePassed` é compartilhado pela página pública e pela API: após o prazo, não renderiza o formulário e o envio retorna 410, inclusive para formulários abertos anteriormente. Não depende de expires_at dos links nem altera automaticamente o status persistido.

- Prazo de resposta é obrigatório ao criar/configurar pesquisas. Contratos de escrita recusam ausência/null e a ativação revalida o prazo persistido, inclusive para rascunhos antigos. Leituras preservam compatibilidade com pesquisas antigas sem prazo.


A13: o envio chama `app_private.submit_anonymous_likert_response`. A transação bloqueia o diagnóstico e revalida prazo/status/link/perguntas antes de gravar sessão, todas as respostas e recibo. Reenvio com a mesma chave e respostas (independente da ordem) é idempotente; outra resposta para a mesma chave retorna 409. Falha não cria cookie de sucesso e não deixa sessão parcial. Cookie e rate limit permanecem como travas leves, sem promessa de uma resposta por pessoa entre navegadores.
