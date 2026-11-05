# Formulários dos geradores

`generator-config.ts` define os campos de entrada e rótulos dos cinco briefings, adaptados dos materiais em `Agentes DirectScal`. `GeneratorBriefingWorkspace` é a única interface: mantém estado apenas em memória, mostra campos essenciais pendentes e gera Markdown com marcações explícitas para lacunas. Copiar e baixar o briefing são ações locais. Não apresentar o arquivo como contrato, diagnóstico, proposta, documento geral ou SOP concluído.

Preserve o padrão visual do admin, tokens e foco visível. Se houver geração de documentos em uma etapa futura, separe a revisão factual e editorial da publicação ou envio ao cliente.

No gerador de diagnósticos, o CSV exportado de Pesquisas é lido somente no navegador e reduzido a agregados pelo helper puro `diagnostic-generator-csv.ts`. A tela mostra bases por grupo, médias, diferenças entre grupos e alertas; `Gerar rascunho` combina esses cálculos com o briefing em seções editáveis e permite baixar Markdown. Alterar o briefing marca o rascunho como desatualizado; gerar novamente substitui as edições. Nenhum arquivo ou rascunho é persistido.
