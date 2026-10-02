# Ativos de gestão e agente de consulta

Status: fases 1 a 4 implementadas; piloto pendente de migration aplicada e avaliação com empresa de teste  
Data: 25 de setembro de 2026 · atualizado em 1 de outubro de 2026  
Escopo atual: fluxo editorial no admin, biblioteca do cliente no Supabase, agente no app e no Slack com instalação por empresa

## 1. Contexto

A Directscal produz ativos operacionais durante os Projetos de Estruturação Empresarial, incluindo SOPs, playbooks, políticas, matrizes RACI, ritos de governança, critérios de qualidade, checklists e templates.

Esses ativos não devem ser entregues apenas como documentos estáticos. O sistema deve registrá-los no contexto da empresa, submetê-los a um fluxo editorial conduzido por um especialista Directscal e torná-los pesquisáveis por um agente dentro da aplicação.

O objetivo desta etapa é reduzir o atrito para localizar e aplicar orientações operacionais. O primeiro canal externo implementado é o Slack; ClickUp, WhatsApp ou outros canais continuam fora do escopo.

## 2. Decisões de produto

Estão aprovadas as seguintes decisões para o planejamento:

1. Todo ativo pertence obrigatoriamente a uma empresa.
2. Um ativo pode ser associado a um Projeto de Estruturação, sem tornar essa associação obrigatória na primeira entrega.
3. O fluxo editorial segue o mesmo princípio das entregas de diagnóstico: a Directscal prepara, revisa e publica; o cliente consome apenas o que foi publicado.
4. Apenas especialistas Directscal autorizados podem criar, editar, revisar, publicar, substituir ou arquivar ativos.
5. Usuários da empresa não editam ativos na primeira versão.
6. O agente consulta exclusivamente versões publicadas e autorizadas para a empresa do usuário.
7. Toda resposta deve apresentar fonte rastreável ou uma recusa explícita por falta de evidência.
8. O Directscal e o Supabase permanecem como fonte de verdade dos ativos, versões, permissões e publicações.
9. Jarvs é uma camada opcional e substituível de interpretação e geração de respostas. Ele não controla documentos, publicações, permissões ou índices.
10. O Slack funciona como adaptador de entrada e saída; o Directscal/Supabase continua sendo a fonte de verdade.

11. O Slack é instalado por empresa via OAuth (um workspace ativo pertence a uma empresa). O app responde menções na thread e mensagens diretas, sempre com a organização da instalação, e oferece avaliação útil/não útil na própria mensagem.
12. O conteúdo dos ativos textuais (SOP, playbook, governança) é escrito num editor de texto (Tiptap) com vocabulário restrito e guardado como JSON validado. A matriz RACI terá componente tabular próprio em etapa futura.
13. A criação replica o fluxo de diagnósticos: drawer em três etapas para identificar o ativo e o ponto de partida; o conteúdo é escrito numa página própria do ativo.
14. A IA participa só da redação da resposta. Busca, filtro por empresa, permissões e citações são do Directscal. O provedor é configurável (Anthropic, Gemini, Ollama ou modo extrativo sem IA).

## 3. Objetivo da primeira entrega

Permitir que um especialista Directscal publique ativos vinculados a uma empresa e que um usuário dessa empresa faça perguntas dentro da aplicação, recebendo respostas fundamentadas nas versões publicadas.

### Resultado esperado

O usuário deve conseguir perguntar, por exemplo:

> Quem pode aprovar um desconto acima de 15%?

E receber uma resposta no seguinte formato:

> Descontos acima de 15% exigem aprovação do Diretor Comercial. O responsável pela negociação deve registrar a justificativa antes de solicitar a aprovação.
>
> Fonte: Política comercial — Alçadas de desconto, versão 3, atualizada em 18/09/2026.

Quando não houver evidência suficiente:

> Não encontrei uma regra publicada para essa situação. Consulte o responsável pelo ativo ou solicite uma definição à liderança da área.

A recusa fundamentada faz parte do comportamento esperado do produto.

## 4. Tipos de ativo

A primeira modelagem deve suportar:

- SOP;
- playbook;
- política;
- rito de governança;
- matriz RACI;
- checklist;
- critério de qualidade;
- template operacional;
- outro ativo operacional classificado pelo especialista.

O tipo organiza catálogo, filtros e apresentação. Ele não deve criar tabelas ou fluxos separados para cada formato.

## 5. Modelo operacional

```text
Empresa
  └── Projeto de Estruturação, quando aplicável
       └── Ativo de gestão
            ├── metadados
            ├── responsável
            ├── escopo organizacional
            ├── versões
            └── publicação vigente

Especialista Directscal
  → cria ou importa o ativo
  → salva como rascunho
  → envia para revisão
  → conclui a revisão
  → publica uma versão
  → sistema indexa a publicação
  → cliente consulta pelo agente
```

## 6. Papéis e permissões

### Superadmin Directscal

- Visualiza ativos de todas as empresas na superfície administrativa.
- Pode atribuir ou substituir o especialista responsável.
- Pode intervir em publicação e arquivamento.
- Acessa auditoria e indicadores da operação.

### Especialista Directscal

- Visualiza as empresas e entregas sob sua responsabilidade.
- Cria e importa ativos.
- Edita rascunhos.
- Envia ativos para revisão.
- Publica versões autorizadas.
- Arquiva ou substitui versões conforme as permissões definidas.

### Superadmin da empresa (`cliente`)

- Visualiza todos os ativos publicados da própria empresa.
- Pesquisa e consulta o agente.
- Envia feedback sobre respostas.
- Não acessa rascunhos nem conteúdo de outras empresas.

### Admin da empresa (`admin`)

- Visualiza ativos publicados permitidos para sua atuação.
- Pesquisa e consulta o agente.
- Envia feedback sobre respostas.
- Não acessa rascunhos, publicações de outras empresas ou ativos fora de seu escopo.

O acesso por setor ou papel pode ser introduzido gradualmente. Mesmo quando o primeiro corte permitir acesso organizacional amplo, o modelo de dados não deve impedir escopos mais restritos no futuro.

## 7. Estados e versionamento

### Estados do ativo

- `rascunho`: conteúdo em preparação, visível apenas à operação autorizada.
- `em_revisao`: conteúdo bloqueado ou controlado durante revisão editorial.
- `pronto_para_publicar`: revisão concluída e publicação autorizada.
- `publicado`: existe uma versão vigente disponível para o cliente e para pesquisa.
- `arquivado`: ativo retirado de circulação e indisponível para novas respostas.

### Regras de versionamento

1. Uma publicação é imutável.
2. Editar um ativo publicado cria uma nova versão em rascunho.
3. A versão publicada anterior continua vigente até a publicação da nova versão.
4. Apenas uma versão pode ser vigente por ativo.
5. A publicação registra especialista, data e número da versão.
6. A indexação utiliza somente a versão vigente.
7. O arquivamento remove o ativo dos resultados futuros sem apagar o histórico.
8. Respostas auditadas preservam a referência à versão utilizada, mesmo depois de uma nova publicação.

## 8. Modelo de dados proposto

Os nomes são propostas de implementação e podem ser refinados antes da migration.

### `management_assets`

Identidade e estado corrente do ativo.

- `id`
- `organization_id`
- `structuring_project_id`, opcional
- `type`
- `title`
- `description`
- `owner_person_id`, opcional
- `owner_label`, para responsáveis ainda não vinculados
- `status`
- `current_published_version_id`, opcional
- `created_by_user_id`
- `assigned_specialist_id`, opcional
- `created_at`
- `updated_at`
- `archived_at`, opcional

### `management_asset_versions`

Conteúdo imutável de cada versão.

- `id`
- `asset_id`
- `organization_id`
- `version_number`
- `content_format`
- `content`
- `summary`, opcional
- `change_note`, opcional
- `created_by_user_id`
- `reviewed_by_user_id`, opcional
- `published_by_user_id`, opcional
- `created_at`
- `reviewed_at`, opcional
- `published_at`, opcional

Duplicar `organization_id` na versão facilita políticas, auditoria e consultas seguras, mas a consistência com o ativo deve ser garantida por constraint ou função transacional.

### `management_asset_scopes`

Escopos opcionais de visibilidade.

- `id`
- `asset_id`
- `organization_id`
- `scope_type`: organização, setor, papel ou pessoa
- `sector_id`, opcional
- `person_id`, opcional
- `role`, opcional

### `management_asset_chunks`

Trechos derivados de uma versão publicada para pesquisa.

- `id`
- `organization_id`
- `asset_id`
- `version_id`
- `ordinal`
- `heading_path`
- `content`
- `content_tsv`
- `embedding`
- `token_count`
- `created_at`

### `asset_question_audits`

Auditoria mínima das consultas realizadas.

- `id`
- `organization_id`
- `user_id`
- `question`
- `answer`
- `answer_status`: respondida, insuficiente ou erro
- `confidence`
- `source_version_ids`
- `latency_ms`
- `created_at`

O período de retenção das perguntas deve ser definido antes de produção. Tokens, segredos e conteúdo de sessão não pertencem a esta tabela.

### `asset_answer_feedback`

- `id`
- `question_audit_id`
- `organization_id`
- `user_id`
- `value`: útil ou não útil
- `comment`, opcional
- `created_at`

## 9. Segurança e isolamento

O mecanismo deve seguir a mesma fronteira organizacional aplicada aos diagnósticos.

Requisitos obrigatórios:

- Todas as tabelas expostas no schema `public` usam RLS.
- Uma pessoa autenticada só lê ativos publicados da organização em que possui membership ativa.
- Rascunhos e revisões ficam restritos aos handlers administrativos e à operação Directscal.
- `TO authenticated` nunca é suficiente sem predicado de organização e permissão.
- Escritas privilegiadas usam handlers server-side; a `service_role` nunca chega ao navegador.
- A recuperação filtra `organization_id`, publicação e escopo antes de calcular relevância.
- Nenhum resultado de outra organização pode participar da seleção inicial, do reranking ou do prompt enviado ao modelo.
- Funções privilegiadas, quando indispensáveis, vivem em schema privado e não recebem execução pública por padrão.
- Logs não armazenam chaves, tokens nem dados desnecessários do usuário.

O papel técnico `superadmin` continua restrito à superfície administrativa e não deve receber acesso implícito às políticas RLS do aplicativo cliente.

## 10. Indexação e pesquisa

### Publicação

Publicar uma versão deve:

1. validar o estado editorial;
2. marcar a nova versão como vigente;
3. preservar a publicação anterior no histórico;
4. normalizar o conteúdo;
5. dividir o documento por seções semânticas;
6. gerar o índice textual;
7. gerar embeddings de forma assíncrona;
8. marcar a indexação como pronta ou com erro;
9. disponibilizar a nova versão ao agente somente quando a indexação estiver pronta.

### Recuperação

A busca deve combinar:

- pesquisa textual para nomes, siglas, códigos, cargos e termos exatos;
- pesquisa semântica para intenções e formulações equivalentes;
- filtros por empresa, status, versão vigente e escopo;
- limiar mínimo de relevância;
- seleção de poucos trechos com contexto suficiente.

A fonte de cada trecho precisa incluir ativo, seção, versão, data e URL interna.

### Resposta

O serviço de consulta deve expor uma fronteira independente do provedor:

```ts
answerAssetQuestion({
  organizationId,
  userId,
  question,
}): Promise<AssetQuestionAnswer>
```

Contrato de saída proposto:

```ts
type AssetQuestionAnswer = {
  status: "answered" | "insufficient_evidence";
  answer: string;
  confidence: "alta" | "media" | "insuficiente";
  citations: Array<{
    assetId: string;
    versionId: string;
    title: string;
    section: string;
    href: string;
  }>;
  refusalReason?: string;
};
```

O contrato final deve ser validado por Zod antes de chegar à interface.

## 11. Papel do Jarvs

Jarvs não é requisito para velocidade de pesquisa. O desempenho depende principalmente da indexação, dos filtros organizacionais e da recuperação dos trechos.

Jarvs pode atuar nas seguintes responsabilidades:

- interpretar a intenção da pergunta;
- reformular a consulta quando necessário;
- receber os trechos recuperados pelo Directscal;
- compor uma resposta curta e operacional;
- manter contexto breve de conversa;
- acionar ferramentas futuras autorizadas;
- padronizar observabilidade ou roteamento entre modelos, se essa capacidade existir.

Jarvs não pode:

- armazenar a versão oficial dos ativos;
- decidir se uma versão está publicada;
- controlar permissões por empresa;
- pesquisar uma base paralela sem os filtros do Directscal;
- responder com conhecimento externo quando não houver evidência interna;
- alterar ou publicar ativos por conta própria.

A integração deve ser feita por adaptador. O serviço de ativos permanece independente:

```text
Interface do agente
        ↓
Jarvs ou adaptador direto de modelo
        ↓
AssetQuestionService
        ↓
Busca híbrida e autorização Directscal
        ↓
Ativos publicados no Supabase
```

Assim, Jarvs pode ser introduzido, substituído ou removido sem migrar documentos ou reescrever as regras de publicação.

## 12. Superfícies

### Operação Directscal

- `/admin/ativos`: lista de ativos de todas as empresas, com filtro por empresa (substitui a proposta `/admin/empresas/[id]/ativos`, porque o detalhe de empresa ainda usa identificadores derivados de leads).
- `/admin/ativos/[id]`: workspace editorial do especialista.
- `/admin/ativos/perguntas`: perguntas ao agente, com foco em lacunas.

O workspace deve concentrar:

- identificação do ativo;
- responsável e escopo;
- editor do conteúdo;
- histórico de versões;
- revisão;
- prévia;
- publicação;
- estado de indexação;
- perguntas sem resposta relacionadas ao ativo.

### Aplicação do cliente

- A sidebar apresenta a seção `Ativos de gestão` com links ativos para `SOPs`, `Playbooks`, `Governança` e `Matriz RACI`.
- SOPs, Playbooks e Governança são indexados por categoria para suportar conteúdos de diferentes áreas; Matriz RACI permanece organizada sem categoria nesta primeira versão.
- Na biblioteca de SOPs, cada card publicado abre uma página de leitura contínua com autoria, data de atualização, versão, responsável operacional, ciclo de revisão e sumário navegável por seção.
- O conteúdo é o documento do editor, renderizado por componentes próprios; a interface não renderiza HTML livre. A leitura vem do Supabase.
- Cada card da biblioteca registra título, resumo, autor responsável e data de atualização, seguindo a densidade visual do grid de Relatórios.
- `/ativos-de-gestao/<tipo>`: bibliotecas de ativos publicados (SOPs, Playbooks, Governança, Matriz RACI).
- `/ativos-de-gestao/<tipo>/[id]`: leitura nativa da versão vigente (SOP, Playbook e Governança).
- `/assistente`: pesquisa conversacional dos ativos.
- `/configuracoes`: conexão do Slack pelo Superadmin da empresa.

O agente deve sempre permitir abrir a fonte original na aplicação.

## 13. Fases de implementação

### Fase 1 — Publicação dos ativos

Entregas:

- contratos Zod;
- migrations e RLS;
- data-source server-side;
- lista administrativa por empresa;
- workspace editorial;
- versionamento;
- revisão, publicação e arquivamento;
- biblioteca de leitura do cliente.

Critérios de aceite:

- um ativo pertence obrigatoriamente a uma empresa;
- somente a operação autorizada altera ou publica;
- o cliente não acessa rascunhos;
- editar um publicado cria nova versão;
- a versão anterior permanece vigente até a nova publicação;
- nenhum usuário acessa ativos de outra empresa.

### Fase 2 — Indexação e pesquisa

Entregas:

- processamento de conteúdo;
- chunks por seção;
- índice textual;
- embeddings;
- busca híbrida;
- fila de indexação e retentativas;
- auditoria de falhas.

Critérios de aceite:

- somente versões publicadas e vigentes são indexadas;
- uma nova publicação substitui a versão pesquisável de forma controlada;
- consultas nunca recuperam conteúdo de outra empresa;
- termos exatos e perguntas semânticas retornam fontes relevantes;
- falhas de indexação não tornam conteúdo incompleto disponível.

### Fase 3 — Agente dentro do Directscal

Entregas:

- rota `/assistente`;
- serviço `answerAssetQuestion`;
- resposta com citações;
- recusa por evidência insuficiente;
- link para a fonte;
- histórico mínimo;
- feedback útil ou não útil;
- painel operacional de perguntas sem resposta.

Critérios de aceite:

- toda resposta contém ao menos uma fonte autorizada;
- ausência de fonte produz recusa, não resposta inventada;
- citações preservam a versão usada;
- o usuário consegue abrir o ativo original;
- feedback negativo pode ser rastreado até pergunta, resposta e fontes.

### Fase 4 — Integração opcional com Jarvs

Entregas:

- adaptador do Jarvs;
- validação de contrato de entrada e saída;
- métricas comparativas contra a chamada direta de modelo;
- fallback controlado quando Jarvs estiver indisponível.

Critérios de aceite:

- ativar ou remover Jarvs não altera o armazenamento dos ativos;
- permissões e recuperação continuam sob responsabilidade do Directscal;
- respostas do Jarvs passam pelas mesmas regras de citação e recusa;
- custo, latência e qualidade são comparados antes de torná-lo padrão.

## 14. Fora do escopo atual

- WhatsApp;
- ClickUp;
- leitura de conversas externas;
- acompanhamento e cobrança autônoma de responsáveis;
- validação automática de tarefas;
- criação autônoma de entregas;
- atualização ou publicação automática de ativos;
- pesquisa na internet para complementar respostas;
- edição de ativos por usuários da empresa;
- execução de decisões ou mudanças operacionais pelo agente.

## 15. Métricas do piloto

- Percentual de respostas com fonte válida.
- Percentual de recusas corretas.
- Zero incidentes de recuperação entre empresas.
- Taxa de respostas avaliadas como úteis.
- Perguntas sem resposta por área e ativo.
- Tempo mediano para recuperar fontes.
- Tempo mediano para gerar a resposta completa.
- Taxa de abertura do ativo citado.
- Frequência de consulta por usuário ativo.
- Quantidade de lacunas documentais transformadas em novos ativos ou revisões.

Meta inicial de qualidade para o conjunto de avaliação: ao menos 85% de respostas corretas ou corretamente recusadas, sempre com rastreabilidade das fontes utilizadas.

## 16. Plano de validação

Antes do piloto:

1. Selecionar uma empresa de teste sem misturar dados de produção ativos.
2. Publicar de 10 a 20 ativos representativos.
3. Criar um conjunto de aproximadamente 50 perguntas conhecidas.
4. Incluir perguntas respondíveis, ambíguas, contraditórias e sem resposta.
5. Avaliar recuperação, resposta, fonte, permissão e recusa.
6. Testar explicitamente tentativas de acessar outra empresa.
7. Medir latência e custo por consulta.
8. Executar advisors e testes de RLS antes de qualquer uso com cliente.

## 17. Questões abertas

Resolvidas em 1 de outubro de 2026:

- Editor e formato: Tiptap, com JSON do editor como formato canônico (`content_format = json`).
- Fluxo de revisão: qualquer superadmin move de `em_revisao` para `pronto_para_publicar`; revisão e publicação podem ser feitas pela mesma pessoa nesta primeira versão, com `reviewed_by` e `published_by` registrados.
- Provedor: configurável. Recomendação para dados reais é a API da Anthropic; testes com Gemini gratuito ou Ollama local, somente com conteúdo fictício no caso do Gemini.
- Histórico do agente: apenas a conversa aberta; sem memória entre sessões.

Ainda abertas:

- Arquivos PDF e DOCX serão apenas anexos ou poderão originar conteúdo editável?
- O primeiro corte terá acesso amplo por organização ou escopo por setor desde o início?
- Qual política de retenção será aplicada às perguntas e respostas?
- Qual produto ou implementação específica é chamada de Jarvs e quais contratos ela oferece?

## 18. Estado da implementação

Implementado em 1 de outubro de 2026:

- Migration `20261001120000_management_asset_editorial_agent.sql`: estado editorial por versão, imutabilidade de versões publicadas, rascunho único por ativo, publicação transacional (`app_private.publish_management_asset_version`), busca híbrida em português (`pt_unaccent` + `pgvector`, fusão RRF) filtrada pela organização antes do ranking, auditoria multicanal e instalação do Slack por workspace.
- Fase 1: `/admin/ativos` com criação a partir de modelos, editor Tiptap, revisão, publicação, arquivamento, restauração e histórico; bibliotecas e leitura do cliente lendo do Supabase.
- Fase 2: trechos por seção H2/H3, embeddings opcionais (Gemini ou Ollama, 768 dimensões) e `Reindexar vetores` para completar falhas.
- Fase 3: `answerAssetQuestion` com citações, recusa por evidência insuficiente, auditoria, feedback e painel de lacunas; `/assistente` ligado ao serviço.
- Slack: OAuth por empresa, menções e mensagens diretas, confirmação imediata com processamento em segundo plano, descarte de reenvios e botões de avaliação.
- Fase 4 (preparação): `npm run eval:seed` publica os SOPs de modelo numa empresa de teste e `npm run eval:agent` mede o conjunto de 50 perguntas contra a meta de 85% e testa isolamento entre empresas.

Pendências:

- Aplicar a migration no Supabase antes de usar as telas novas.
- Rodar o piloto (seção 16) com o provedor escolhido.
- Persistir especialistas no banco; hoje o catálogo é local, como nas entregas.
- Escopo por setor, papel ou pessoa: o modelo existe (`management_asset_scopes`), mas a leitura ainda é por organização.
- Política de retenção das perguntas e respostas.
- Componente tabular da matriz RACI.
- Adaptador Jarvs (fase opcional).

## 19. Definição de pronto do produto

A primeira entrega funcional estará pronta quando:

- o especialista publicar um ativo para uma empresa;
- o cliente visualizar apenas a versão publicada;
- a nova publicação for indexada com rastreabilidade;
- o agente responder uma pergunta com base nos trechos corretos;
- a resposta exibir ativo, seção e versão;
- uma pergunta sem evidência resultar em recusa explícita;
- os testes demonstrarem isolamento entre organizações;
- a documentação técnica das pastas afetadas estiver atualizada;
- a mudança estrutural estiver registrada no Notion antes da entrega final de implementação.
