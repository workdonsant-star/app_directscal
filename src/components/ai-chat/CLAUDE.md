# `src/components/ai-chat` — WorkFlow

## Propósito

Esta pasta concentra a interface conversacional autenticada da Directscal, ligada ao agente de consulta dos ativos publicados.

## Convenções locais

- Mantenha o chat em uma coluna de leitura com largura controlada, sem transformar cada área em card.
- Mensagens do assistente ficam em texto livre, sem avatar ou superfície; mensagens da pessoa ficam alinhadas à direita sobre `bg-sidebar`.
- Toda mensagem da pessoa usa a foto do perfil autenticado, incluindo overrides locais; quando ela não existir, mostre as iniciais do nome como fallback.
- O azul de marca permanece reservado para ações e foco.
- A conversa abre com uma mensagem explicando o escopo (ativos publicados, fonte citada, recusa quando não houver regra). Não use mensagens de demonstração.
- Cada resposta do assistente mostra as fontes (ativo, seção, versão e data) como links para a leitura e os botões `Resposta útil`/`Resposta não útil`.
- Cada pergunta envia até seis turnos anteriores da tela como `history`, para o agente entender continuações. A mensagem de abertura e falhas técnicas não entram.
- Enquanto a pergunta é processada, a mensagem pendente usa `aria-busy` e o compositor fica bloqueado.
- Preserve navegação por teclado, foco visível, `aria-live` para novas mensagens e contraste nos dois temas.
