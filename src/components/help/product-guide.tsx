import Link from "next/link";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";

type GuideSection = { id: string; title: string; steps: string[]; links?: { label: string; href: string }[] };
const customerSections: GuideSection[] = [
  { id: "pesquisas", title: "Preparar e acompanhar uma pesquisa", steps: [
    "Em Pesquisas, crie a coleta com nome, prazo de resposta e lideranças. Ative quando a configuração estiver pronta.",
    "Copie os links de Fundador, Liderança e Times nas colunas da pesquisa. Distribua cada link ao público correspondente; os links do time são separados por setor.",
    "Acompanhe as respostas e use o menu da pesquisa para encerrar a coleta. O encerramento impede novas respostas.",
  ], links: [{ label: "Abrir Pesquisas", href: "/omdx/diagnosticos" }] },
  { id: "analytics", title: "Ler os resultados no Analytics", steps: [
    "Selecione a pesquisa e confira a média das percepções, o volume de respostas por nível e as notas por dimensão.",
    "Use as diferenças entre camadas e as perguntas de menor nota para orientar a investigação com o consultor. A pesquisa registra percepções; consultas a documentos e execução são acompanhamentos distintos.",
    "As páginas de Dimensões aprofundam Cultura, Visão, Comunicação, Processos, Liderança e Performance. Ao comparar coletas, considere também o público e o instrumento usado.",
  ], links: [{ label: "Abrir Analytics", href: "/omdx" }] },
  { id: "diagnosticos", title: "Consultar o diagnóstico e os Action Points", steps: [
    "Em Diagnósticos, abra a análise publicada pelo consultor. O rascunho interno não substitui o relatório que você recebeu.",
    "Relatório (PDF) baixa a análise formatada. Dados (PDF) baixa a base detalhada; o CSV permanece disponível em Pesquisas.",
    "Em Action Points, abra a pessoa responsável e o detalhe da ação. Confira descrição, prazo e acompanhamento. Sem responsável indica atribuição pendente; Sem medição indica ausência de dados de execução.",
    "Baixar Action Points fica na barra superior da página. O download reúne as ações publicadas da coleta selecionada.",
  ], links: [{ label: "Abrir Diagnósticos", href: "/relatorios" }, { label: "Abrir Action Points", href: "/action-points" }] },
  { id: "ativos", title: "Usar e manter os ativos de gestão", steps: [
    "Abra uma pasta em Ativos de gestão e selecione o documento. Confira líder responsável, versão, ciclo de revisão e data de atualização. Baixar MD exporta o conteúdo publicado.",
    "Uma revisão vencida indica manutenção pendente; o documento permanece disponível até ser atualizado ou arquivado pela operação.",
    "O dono da empresa pode usar Editar ativo. Nesse caminho, Salvar atualização publica uma nova versão imediatamente. Para revisão editorial antes da publicação, solicite a alteração à operação DirectScal.",
  ], links: [{ label: "Abrir Ativos de gestão", href: "/ativos-de-gestao" }] },
  { id: "consulta", title: "Tirar dúvidas no app e no Slack", steps: [
    "No documento, use Consultar agente. Escreva uma pergunta específica, com o nome do processo e a dúvida. O agente consulta os ativos publicados para sua empresa.",
    "Confira as fontes abaixo da resposta: documento, seção, versão e data. Abra o link para ler a publicação vigente e avalie a resposta como útil ou não útil.",
    "Quando não houver orientação suficiente, o agente deve informar essa ausência. Uma mensagem de erro técnico indica falha de consulta, não ausência de regra.",
    "Com o Slack conectado pela empresa, mencione o bot ou envie uma mensagem direta. Confira a fonte da mesma forma. Se a resposta não chegar, informe à operação o canal e o horário, sem compartilhar tokens ou credenciais.",
  ], links: [{ label: "Abrir agente", href: "/assistente" }] },
];
const operationSections: GuideSection[] = [
  { id: "empresa", title: "Preparar a empresa e a responsabilidade", steps: [
    "Em Empresas, abra a empresa que concluiu o cadastro de aquisição. Confirme o contexto antes de iniciar a entrega.",
    "Escolha o Especialista principal e use Salvar atribuição na barra superior. O principal é sugerido para novas entregas; publicações anteriores conservam a atribuição da própria entrega.",
    "Revise o cadastro em Especialistas: nome, cargo e contato usados no relatório devem corresponder à pessoa atribuída. Não use a conta administrativa para entrar como cliente.",
  ], links: [{ label: "Abrir Empresas", href: "/admin/empresas" }, { label: "Abrir Especialistas", href: "/admin/especialistas" }] },
  { id: "entrega", title: "Da coleta à entrega publicada", steps: [
    "Oriente o dono da empresa a configurar setores e lideranças, preparar a pesquisa e compartilhar os links corretos. Acompanhe o encerramento combinado.",
    "Na fila de Operação ou nas Entregas da empresa, abra a coleta encerrada. Confira a base em Dados, redija o Relatório e selecione os Action Points.",
    "Salvar rascunho preserva a versão que o cliente já recebeu. Revise a prévia e publique quando relatório, ações e especialista estiverem corretos. Para corrigir uma entrega publicada, edite, confira e publique novamente.",
    "No contexto autorizado do cliente, confira o relatório, seus dois PDFs e as ações da mesma coleta. Atribuição de responsável e prazo acordado são acompanhamentos próprios das ações.",
  ], links: [{ label: "Abrir Operação", href: "/admin/operacao" }] },
  { id: "publicacao", title: "Criar, revisar e publicar um ativo", steps: [
    "No detalhe da empresa, abra Criação dos ativos. Use Criar ativo, escolha SOP, Playbook, Governança ou Matriz RACI e um modelo ou documento em branco.",
    "Preencha título, resumo, conteúdo, líder responsável e ciclo de revisão. Na RACI, confira as atividades e as responsabilidades de executar, aprovar, consultar e informar.",
    "Salve a versão, envie para revisão, aprove a revisão e publique. Somente a versão publicada vigente fica disponível ao cliente e à consulta do agente.",
    "Ao alterar um ativo já publicado, salve o rascunho e confira que a versão anterior continua pública. Publique a revisão para disponibilizar a nova instrução. Se houver conflito, preserve sua redação e confira a versão mais recente antes de reaplicar a alteração.",
    "Use Revisão vencida na lista para localizar manutenção pendente e conferir responsável e prazo. Sem periodicidade definida não há prazo calculado. Arquivar retira o ativo da consulta vigente e preserva o histórico; Restaurar ativo recupera o documento conforme seu estado editorial. Ativos ligados a rotinas devem ser arquivados, sem exclusão definitiva.",
  ] },
  { id: "qualidade", title: "Conferir a consulta e corrigir orientações", steps: [
    "Depois de publicar, teste uma pergunta específica no app com uma conta cliente autorizada. Confira resposta, fonte e versão; depois repita no Slack de teste conectado à mesma empresa.",
    "Pergunte também algo ausente no acervo: o agente deve reconhecer que não encontrou orientação suficiente. Falha técnica não conta como recusa correta.",
    "Na área de Perguntas dos ativos, revise lacunas e avaliações. Corrija o documento, passe pela revisão editorial, publique e repita a pergunta. Não corrija só a resposta isolada se a orientação publicada estiver errada.",
  ] },
  { id: "falhas", title: "Tratar uma falha no Slack", steps: [
    "No detalhe da empresa, abra Entregas no Slack e use Consultar entregas. A lista mostra metadados, estado, tentativas e confirmação, sem expor o texto das conversas.",
    "Pendente ou Processando: aguarde e atualize a lista. Falhou com próxima tentativa automática: respeite a janela indicada. Se persistir, verifique a conexão e acione o responsável técnico pelo consumidor da fila.",
    "Falhou sem tentativa automática: corrija a causa e use Recuperar entrega. Confirme somente para o workspace correto. Recolocar na fila ainda não confirma que a mensagem foi entregue.",
    "Incerto: abra a conversa original e confira se a resposta já chegou. Registre a evidência e encaminhe à revisão técnica; não repita a pergunta para forçar reenvio. A interface não oferece recuperação de um envio incerto.",
    "Entregue exige confirmação do Slack. Encerrado sem envio significa que o evento terminou sem enviar mensagem. Depois de recuperar uma falha, confira a confirmação e a ausência de duplicação na conversa.",
  ] },
];

export function ProductGuide({ audience }: { audience: "customer" | "operation" }) {
  const sections = audience === "operation" ? operationSections : customerSections;
  return <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,760px)]">
    <aside className="hidden lg:block"><div className="sticky top-8"><DocumentTableOfContents ariaLabel="Nesta página" items={sections.map(section => ({ href: `#${section.id}`, label: section.title }))} /></div></aside>
    <article className="min-w-0">
      <h1 className="text-ui-page">{audience === "operation" ? "Guia de operação" : "Guia de uso"}</h1>
      <p className="mt-3 max-w-prose text-balance text-sm text-muted-foreground">{audience === "operation" ? "Preparar a conta, publicar a entrega e manter orientações que o cliente consegue consultar." : "Encontre pesquisas, diagnósticos, ações e orientações da sua empresa."}</p>
      {sections.map(section => <section key={section.id} id={section.id} className="scroll-mt-8 border-b py-8 last:border-0">
        <h2 className="text-ui-section">{section.title}</h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-sm leading-7 text-muted-foreground">{section.steps.map(step => <li key={step}>{step}</li>)}</ol>
        {section.links ? <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2">{section.links.map(link => <Link className="rounded-sm text-sm underline underline-offset-4 focus-visible:ring-2 focus-visible:ring-ring" key={link.href} href={link.href}>{link.label}</Link>)}</div> : null}
      </section>)}
    </article>
  </div>;
}
