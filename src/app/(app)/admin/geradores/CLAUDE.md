# Geradores — superadmin

As cinco rotas `/admin/geradores/[tipo]` são formulários de briefing para contratos, diagnósticos, documentos gerais, propostas e SOPs. O layout administrativo exige `superadmin`. Cada tela usa os campos correspondentes aos materiais em `Agentes DirectScal`, apresenta uma prévia Markdown e permite copiar ou baixar o briefing. Diagnósticos também recebe CSV de respostas, calcula agregados locais e monta um rascunho editorial revisável em Markdown. Não chama IA, não publica nem grava dados no servidor ou no navegador.

Novos tipos e campos ficam em `src/components/admin/generators/generator-config.ts`. A página valida o tipo antes de renderizar o componente compartilhado. Ao ligar geração ou persistência posteriormente, criar contratos e autorização próprios, sem tratar o briefing como documento publicado.
