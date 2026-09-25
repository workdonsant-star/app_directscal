# Design QA — cartão do especialista

## Fonte visual e evidências

- Referência do estado anterior: `/var/folders/lc/z_tkz2qd17nbgkzjxdqx91l80000gn/T/TemporaryItems/NSIRD_screencaptureui_o0DXvf/Captura de Tela 2026-09-04 às 10.22.16.png` (`492 × 700` px).
- Implementação em tema claro: `/private/tmp/specialist-card-contact-button.png` (`1280 × 720` px, viewport `1280 × 720` CSS px, densidade `1×`).
- Implementação em tema escuro: `/private/tmp/specialist-card-contact-button-dark.png` (`1280 × 720` px, viewport `1280 × 720` CSS px, densidade `1×`).
- Comparação focada conjunta: `/private/tmp/specialist-card-contact-button-comparison.png` (`860 × 420` px).
- Estado: usuário autenticado, cartão renderizado na largura real de `216px` da coluna lateral do relatório.

## Comparação da visão completa

- O cartão foi validado dentro do shell autenticado real para conferir proporção e contraste no contexto do relatório.
- O conteúdo preserva foto, selo, nome e localização do estado anterior.
- O texto de tempo foi capitalizado e o número visível foi substituído por um botão de contato, conforme solicitado.

## Comparação focada

- A comparação conjunta apresenta a referência e as implementações light/dark no mesmo artefato.
- Tipografia: `Especialista há 2 anos` usa sentence case e mantém o alinhamento com o ícone.
- Espaçamento: o botão ocupa a largura disponível e preserva o ritmo vertical do cartão.
- Cores: o botão usa o contraste semântico do primitive do app, preto no tema claro e branco no escuro.
- Imagem: a foto de Don Santos mantém proporção, nitidez e enquadramento.
- Copy: a ação visível contém somente `Contato`.

## Interação e acessibilidade

- O botão `Contato` aponta para `wa.me/5511947641451` e abre em nova aba.
- O primitive preserva hover, foco visível, cursor e área de clique adequada.
- O ícone da ação é decorativo; o link expõe o nome acessível `Contato`.
- A renderização não apresentou overflow, corte ou quebra indevida na largura real da coluna.

## Achados e histórico

1. A ação inicial era um link textual com o número de WhatsApp.
2. Uma primeira tentativa de botão outline ficou visualmente sutil demais na largura reduzida.
3. A ação passou a usar o botão preenchido semântico, com contraste claro nos dois temas.
4. A comparação final não encontrou pendências P0, P1 ou P2.

final result: passed
