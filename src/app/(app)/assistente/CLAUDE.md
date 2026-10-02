# `/assistente` — WorkFlow

## Propósito

Tela autenticada de conversa com o agente de consulta: o time pergunta sobre SOPs, playbooks e governança publicados para a empresa e recebe respostas com fonte ou recusa explícita. Apoio a diagnósticos e action points fica para uma etapa futura.

## Convenções locais

- A rota pertence à aplicação do cliente e redireciona `superadmin` para `/admin/operacao`.
- Mantenha `WorkFlow` imediatamente abaixo de `Action Points` na navegação principal.
- A conversa chama `/api/assistant/ask` e `/api/assistant/feedback`; o provedor de IA é configurado no servidor (`src/lib/agent/CLAUDE.md`).
- O histórico vive só na tela aberta. Não há memória entre sessões nesta etapa.
- A tela usa altura restante do shell e mantém rolagem da conversa dentro do workspace.
- Como raiz aberta pela sidebar, a rota não exibe breadcrumb; a conversa começa diretamente abaixo da topbar, sem cabeçalho interno.
- O node Figma `226:7` é o contrato visual desta versão.
