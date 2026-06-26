import Link from "next/link";

import { AppTopbar } from "@/components/app-topbar";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Documentação — Maturidade",
};

const tableOfContents = [
  { href: "#visao-geral", label: "Visão geral" },
  { href: "#dashboard", label: "Dashboard Maturidade" },
  { href: "#diagnosticos", label: "Diagnósticos" },
  { href: "#criacao", label: "Criação e configuração" },
  { href: "#compartilhamento", label: "Compartilhamento" },
  { href: "#insights", label: "Insights" },
  { href: "#referencias", label: "Referências" },
];

const areas = [
  {
    name: "Maturidade",
    path: "/omdx",
    description:
      "Visão executiva do módulo, com KPIs, maturidade por dimensão e leitura geral.",
  },
  {
    name: "Diagnósticos",
    path: "/omdx/diagnosticos",
    description:
      "Área operacional para listar, filtrar, criar, configurar e compartilhar coletas.",
  },
  {
    name: "Insights",
    path: "/insights/cultura",
    description:
      "Páginas por dimensão para comparar dados agregados e filtrar diagnósticos específicos.",
  },
];

export default function DocumentationPage() {
  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Documentação" }]} />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,760px)]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 border-l pl-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.12em]">
                Nesta página
              </p>
              <DocumentTableOfContents
                ariaLabel="Navegação da documentação"
                items={tableOfContents}
              />
            </div>
          </aside>

          <article className="min-w-0">
            <section id="visao-geral" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Visão geral
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  O sistema está organizado em duas camadas principais. A
                  primeira é executiva: mostra leituras consolidadas, maturidade
                  por dimensão e sinais de atenção. A segunda é operacional:
                  permite criar diagnósticos, acompanhar status e compartilhar
                  links de resposta.
                </p>
                <p>
                  A sidebar é a entrada principal. Use `Maturidade` para leitura
                  geral, `Diagnósticos` para operar coletas e `Insights` para
                  aprofundar cada dimensão do modelo.
                </p>
              </div>
              <div className="mt-8 divide-y border-y">
                {areas.map((area) => (
                  <div
                    key={area.name}
                    className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]"
                  >
                    <div>
                      <Link
                        href={area.path}
                        className="text-foreground text-sm font-medium hover:underline"
                      >
                        {area.name}
                      </Link>
                      <p className="text-muted-foreground mt-1 text-xs">
                        {area.path}
                      </p>
                    </div>
                    <p className="text-muted-foreground text-sm leading-7">
                      {area.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="dashboard" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Dashboard Maturidade
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A página `/omdx` é a visão executiva do módulo. Ela não é a
                  área para criar diagnósticos. O objetivo é dar uma leitura
                  rápida sobre maturidade operacional, respostas acumuladas,
                  score médio e maior gargalo recorrente.
                </p>
                <p>
                  Use esta página para entender o estado geral da operação,
                  revisar sinais recorrentes e decidir onde aprofundar a
                  análise.
                </p>
              </div>
              <div className="mt-6 border-l pl-4">
                <p className="text-foreground text-sm font-medium">
                  Quando usar
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Ao iniciar uma análise executiva, revisar sinais gerais ou
                  apresentar uma visão consolidada para decisores.
                </p>
              </div>
            </section>

            <section id="diagnosticos" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Diagnósticos
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A página `/omdx/diagnosticos` é a área operacional do módulo.
                  É nela que ficam a lista completa de diagnósticos, filtros por
                  status e ações de criação, configuração, compartilhamento,
                  progresso e resultado.
                </p>
                <p>
                  Esta separação evita que o dashboard vire uma tela de
                  operação. O dashboard responde “como estamos”. Diagnósticos
                  responde “o que preciso operar agora”.
                </p>
              </div>
              <ul className="mt-6 space-y-3 border-y py-5">
                <li className="text-muted-foreground text-sm leading-6">
                  Ver diagnósticos em rascunho, ativos e encerrados.
                </li>
                <li className="text-muted-foreground text-sm leading-6">
                  Abrir o drawer para criar ou continuar uma configuração.
                </li>
                <li className="text-muted-foreground text-sm leading-6">
                  Acessar compartilhamento, progresso e resultado quando
                  disponíveis.
                </li>
              </ul>
            </section>

            <section id="criacao" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Criação e configuração
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A criação de diagnóstico acontece dentro de um drawer lateral
                  na página de diagnósticos. O usuário não sai do contexto da
                  lista para configurar uma coleta.
                </p>
                <p>
                  Os campos essenciais são nome do diagnóstico e empresa da
                  sessão. Descrição e prazo são opcionais. O template de Maturidade
                  padrão já vem selecionado.
                </p>
              </div>
              <ol className="mt-6 space-y-4">
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    1. Criar diagnóstico
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Abre o drawer em modo criação, com formulário vazio.
                  </p>
                </li>
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    2. Salvar como rascunho
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Mantém a coleta configurável e sem links ativos.
                  </p>
                </li>
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    3. Ativar diagnóstico
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Gera os links separados por grupo no próprio drawer.
                  </p>
                </li>
              </ol>
            </section>

            <section
              id="compartilhamento"
              className="scroll-mt-24 border-b py-10"
            >
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Compartilhamento
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A central de compartilhamento fica em
                  `/omdx/[id]/compartilhar`. Ela reúne os links públicos de
                  resposta, mensagens sugeridas por grupo, resumo compacto de
                  respostas e ação para encerrar a coleta.
                </p>
                <p>
                  O módulo Maturidade usa três links separados: fundador, liderança e
                  operação. Essa separação preserva a leitura por camada e evita
                  que o respondente precise escolher seu grupo no formulário
                  público.
                </p>
              </div>
              <div className="mt-8 divide-y border-y">
                <div className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]">
                  <p className="text-foreground text-sm font-medium">
                    Copiar link
                  </p>
                  <p className="text-muted-foreground text-sm leading-7">
                    Usa o link correto para convidar cada grupo.
                  </p>
                </div>
                <div className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]">
                  <p className="text-foreground text-sm font-medium">
                    Abrir prévia
                  </p>
                  <p className="text-muted-foreground text-sm leading-7">
                    Mostra a introdução pública em `/r/[token]`.
                  </p>
                </div>
                <div className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]">
                  <p className="text-foreground text-sm font-medium">
                    Encerrar coleta
                  </p>
                  <p className="text-muted-foreground text-sm leading-7">
                    Persiste o diagnóstico como encerrado e bloqueia novas
                    respostas.
                  </p>
                </div>
              </div>
            </section>

            <section id="insights" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Insights
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A seção `Insights` organiza a análise por dimensão. Cada item
                  da sidebar abre um dashboard compacto para Cultura, Visão,
                  Comunicação, Processos, Liderança ou Performance.
                </p>
                <p>
                  A visão padrão consolida todos os diagnósticos com dados. O
                  filtro permite analisar um diagnóstico específico para
                  entender se a dimensão mudou conforme o contexto da coleta.
                </p>
              </div>
              <div className="mt-6 border-l pl-4">
                <p className="text-foreground text-sm font-medium">
                  Quando usar
                </p>
                <p className="text-muted-foreground mt-1 text-sm leading-6">
                  Ao investigar uma dimensão específica, comparar diagnósticos
                  ou entender diferenças entre fundador, liderança e operação.
                </p>
              </div>
            </section>

            <section id="referencias" className="scroll-mt-24 py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Referências
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  Use esta documentação quando a dúvida for operacional ou
                  conceitual: onde cada área fica, o que Maturidade mede, como a
                  escala é lida e por que a leitura por camada importa.
                </p>
                <p>
                  O fluxo principal de uso do módulo está consolidado aqui,
                  junto com as referências práticas para operar diagnósticos,
                  compartilhamento e insights.
                </p>
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                <Button
                  nativeButton={false}
                  render={<Link href="/omdx/diagnosticos" />}
                >
                  Abrir diagnósticos
                </Button>
              </div>
            </section>
          </article>
        </div>
      </main>
    </>
  );
}
