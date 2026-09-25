# `/relatorios` — Listagem de relatórios

Esta rota autenticada é a entrada de `Relatórios` na seção `Documentos` da sidebar.

## Estado atual

- Lista somente diagnósticos autorizados, com base de respostas para análise e entrega publicada pela operação Directscal.
- Cada relatório aparece em um card clicável com o título obrigatório do diagnóstico, avatar e nome do responsável pela criação, além da data de encerramento ou última atualização.
- Os cards formam uma grade responsiva e abrem a leitura em `/relatorios/[id]`.
- A página inclui um estado vazio quando ainda não existe relatório disponível.
- Permite acesso a usuários do app cliente e redireciona o `superadmin` global para `/admin/operacao`.

## Dados

- A listagem cruza a elegibilidade analítica do Overview com `admin_deliveries.status = 'publicada'` para não antecipar entregas ainda em preparação.
- A rota de detalhe e o download também exigem a publicação, impedindo acesso antecipado por URL direta.
- A rota de detalhe resolve um `DiagnosticReport` autorizado e conecta os seis gráficos às respostas consolidadas daquele diagnóstico.
- Os textos editoriais vêm da entrega publicada; a foto do especialista continua como conteúdo de referência. Fontes, cores e estrutura vêm do próprio app.
