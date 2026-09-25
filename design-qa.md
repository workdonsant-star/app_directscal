# Design QA

## Fonte visual e evidências

- Fonte visual de verdade: `/var/folders/lc/z_tkz2qd17nbgkzjxdqx91l80000gn/T/TemporaryItems/NSIRD_screencaptureui_t4AoV2/Captura de Tela 2026-08-26 às 09.59.38.png` (`3204 × 1700` px, captura Retina `2×`).
- Implementação em desktop: `/private/tmp/profile-company-data-implementation.png` (`1602 × 850` CSS px, densidade `1×`).
- Comparação normalizada: `/private/tmp/profile-company-data-comparison.png`, com a referência reduzida para `1602 × 850` ao lado da implementação.
- Implementação completa em desktop: `/private/tmp/profile-company-data-full-desktop.png`.
- Implementação mobile em tema claro: `/private/tmp/profile-company-data-mobile-company.png` (`390 × 844` CSS px).
- Implementação mobile em tema escuro: `/private/tmp/profile-company-data-mobile-dark.png` (`390 × 844` CSS px).
- Estado validado: usuário autenticado, rota `/perfil`, seção Empresa preenchida pelos dados resolvidos do onboarding.

## Comparação da visão completa

- A superfície principal preserva o card único, borda de `1px`, ausência de sombra, hierarquia tipográfica, separadores e alinhamento da referência.
- O card começa diretamente pelo bloco da foto, sem repetir `Informações de perfil`, sua descrição, `Dados pessoais` ou sua descrição. Segurança mantém a estrutura existente e a seção Empresa cresce verticalmente para acomodar todos os dados solicitados.
- A referência foi capturada sem a navegação lateral completa; a implementação foi comparada dentro do shell autenticado real. Essa diferença de recorte não altera a avaliação do card de Perfil.

## Comparação focada

- Região principal: card de Perfil e seção Empresa, comparados em `/private/tmp/profile-company-data-comparison.png`.
- Região responsiva: seção Empresa em `/private/tmp/profile-company-data-mobile-company.png` e `/private/tmp/profile-company-data-mobile-dark.png`.
- Os campos oficiais usam o mesmo estado desabilitado e o mesmo tratamento cinza do campo de e-mail. Nome social (nome fantasia), nicho, Instagram, website, tamanho e faturamento são editáveis na área da empresa; posição permanece editável, mas aparece em Dados pessoais, junto de nome e e-mail. Somente desafios permanece desabilitado entre as informações comerciais.
- A grade de duas colunas no desktop passa para uma coluna no mobile; os campos permanecem legíveis e sem overflow horizontal.

## Interações e estados

- A rota carregou todos os 25 rótulos esperados e não apresentou erro de console durante a validação inicial.
- Desktop validado em `1602 × 850`; mobile validado em `390 × 844`, com `clientWidth = scrollWidth = 390`.
- Tema escuro validado pela alternância visível da interface; o elemento raiz recebeu a classe `dark` e permaneceu sem overflow horizontal.
- A razão social, os demais dados cadastrais e os desafios permanecem desabilitados; nome pessoal, foto, nome fantasia e as seis informações comerciais autorizadas são editáveis. A quantidade de funcionários não é exibida.

## Achados e histórico

1. A implementação inicial do Perfil consumia somente dados mockados e ignorava o lead de aquisição, classificado como P1 funcional.
2. A origem foi corrigida para resolver o lead `account_created` do usuário e a organização vinculada no servidor.
3. Foram adicionados nome social, nome oficial, CNPJ e todos os demais dados disponíveis no onboarding/CNPJ.
4. A comparação final não encontrou pendências P0, P1 ou P2. Diferenças de conteúdo pessoal entre a referência e a sessão local são esperadas e não representam divergência visual.

final result: passed
