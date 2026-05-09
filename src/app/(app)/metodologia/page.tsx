import Link from "next/link";

import { AppTopbar } from "@/components/app-topbar";
import { DocumentTableOfContents } from "@/components/document-table-of-contents";
import { Button } from "@/components/ui/button";
import {
  getDimensions,
  getDefaultDiagnosticTemplate,
  getRespondentGroups,
} from "@/lib/data/omdx-data-source";

export const metadata = {
  title: "Metodologia — OMDx",
};

const tableOfContents = [
  { href: "#visao-geral", label: "Visão geral" },
  { href: "#aplicacao", label: "Como o diagnóstico é aplicado" },
  { href: "#dimensoes", label: "Dimensões avaliadas" },
  { href: "#camadas", label: "Camadas de percepção" },
  { href: "#escala", label: "Escala de resposta" },
  { href: "#leitura", label: "Leitura dos resultados" },
];

export default function MethodologyPage() {
  const template = getDefaultDiagnosticTemplate();
  const dimensions = getDimensions();
  const respondentGroups = getRespondentGroups();

  return (
    <>
      <AppTopbar breadcrumb={[{ label: "Metodologia" }]} />

      <main className="flex flex-1 flex-col px-6 py-8 lg:px-10">
        <div className="mx-auto grid w-full max-w-6xl gap-10 lg:grid-cols-[220px_minmax(0,760px)]">
          <aside className="hidden lg:block">
            <div className="sticky top-20 border-l pl-4">
              <p className="text-muted-foreground mb-3 text-xs font-medium uppercase tracking-[0.12em]">
                Nesta página
              </p>
              <DocumentTableOfContents
                ariaLabel="Navegação da metodologia"
                items={tableOfContents}
              />
            </div>
          </aside>

          <article className="min-w-0">
            <header className="border-b pb-8">
              <h1 className="text-foreground text-4xl font-semibold tracking-tight">
                Metodologia OMDx
              </h1>
              <p className="text-muted-foreground mt-5 max-w-3xl text-base leading-7">
                O OMDx é um diagnóstico de maturidade operacional aplicado por
                meio de um formulário Likert. Ele cruza seis dimensões críticas
                da operação com a percepção de três camadas da empresa:
                fundador, liderança e operação.
              </p>
              <p className="text-muted-foreground mt-4 max-w-3xl text-base leading-7">
                A metodologia não busca avaliar pessoas individualmente. O
                objetivo é consolidar sinais sobre clareza, execução,
                comunicação, liderança e foco para orientar decisões de
                estruturação.
              </p>
            </header>

            <section id="visao-geral" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Visão geral
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  O OMDx parte de uma premissa simples: empresas em crescimento
                  normalmente não quebram por falta de esforço, mas por falta de
                  estrutura operacional proporcional à ambição do negócio.
                </p>
                <p>
                  Por isso, a leitura combina percepção qualitativa com uma
                  escala padronizada. O resultado mostra onde a empresa já tem
                  base para escalar e onde ainda depende de improviso,
                  concentração de decisão ou alinhamento informal.
                </p>
              </div>
              <dl className="mt-8 grid gap-4 border-y py-5 sm:grid-cols-3">
                <div>
                  <dt className="text-muted-foreground text-xs">Dimensões</dt>
                  <dd className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    {template.dimensions.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">Camadas</dt>
                  <dd className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    {respondentGroups.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs">
                    Escala de resposta
                  </dt>
                  <dd className="text-foreground mt-1 text-2xl font-semibold tabular-nums">
                    1-5
                  </dd>
                </div>
              </dl>
            </section>

            <section id="aplicacao" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Como o diagnóstico é aplicado
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A aplicação acontece em três momentos. Primeiro, o cliente
                  administrador cria o diagnóstico e define contexto, empresa e
                  prazo. Depois, a coleta é compartilhada por links separados
                  para fundador, liderança e operação. Por fim, as respostas são
                  consolidadas em leituras por dimensão, por camada e por
                  criticidade.
                </p>
                <p>
                  A separação por links é parte importante do método. Ela evita
                  misturar percepções com papéis diferentes e permite enxergar
                  desalinhamentos que normalmente ficam invisíveis em uma média
                  geral.
                </p>
              </div>
              <ol className="mt-6 space-y-4">
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    1. Configuração
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Define o contexto da análise e ativa a coleta.
                  </p>
                </li>
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    2. Coleta por grupo
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    Cada camada responde pelo seu próprio link.
                  </p>
                </li>
                <li className="border-l pl-4">
                  <p className="text-foreground text-sm font-medium">
                    3. Leitura executiva
                  </p>
                  <p className="text-muted-foreground mt-1 text-sm leading-6">
                    O resultado aponta maturidade, gargalos e prioridades de
                    estruturação.
                  </p>
                </li>
              </ol>
            </section>

            <section id="dimensoes" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Dimensões avaliadas
              </h2>
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                As seis dimensões representam os blocos mínimos para entender
                se uma operação consegue crescer com consistência. Cada uma
                investiga uma pergunta central.
              </p>
              <div className="mt-8 divide-y border-y">
                {dimensions.map((dimension) => (
                  <section
                    key={dimension.id}
                    className="grid gap-3 py-5 sm:grid-cols-[96px_1fr]"
                  >
                    <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                      {String(dimension.number).padStart(2, "0")}
                    </p>
                    <div>
                      <h3 className="text-foreground text-base font-semibold">
                        {dimension.name}
                      </h3>
                      <p className="text-foreground mt-2 text-sm leading-7">
                        {dimension.question}
                      </p>
                      <p className="text-muted-foreground mt-2 text-sm leading-7">
                        {dimension.description}
                      </p>
                    </div>
                  </section>
                ))}
              </div>
            </section>

            <section id="camadas" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Camadas de percepção
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  A mesma empresa pode parecer madura para quem decide e
                  confusa para quem executa. Também pode parecer urgente para a
                  operação e subestimada pela liderança. Por isso, a leitura por
                  camada é uma das partes centrais do OMDx.
                </p>
                <p>
                  A análise considera três grupos organizacionais. A leitura
                  não busca hierarquizar respostas, mas entender onde a
                  percepção está alinhada e onde existe distância entre intenção
                  estratégica e realidade operacional.
                </p>
              </div>
              <div className="mt-8 divide-y border-y">
                {respondentGroups.map((group) => (
                  <div
                    key={group.id}
                    className="grid gap-2 py-4 sm:grid-cols-[160px_1fr]"
                  >
                    <p className="text-foreground text-sm font-medium">
                      {group.label}
                    </p>
                    <p className="text-muted-foreground text-sm leading-7">
                      {group.description}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section id="escala" className="scroll-mt-24 border-b py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Escala de resposta
              </h2>
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                Cada afirmação do diagnóstico é respondida em uma escala de
                concordância de 1 a 5. A escala permite transformar percepção em
                leitura comparável sem perder o contexto consultivo da análise.
              </p>
              <div className="mt-8 overflow-hidden border-y">
                {template.scale.map((point) => (
                  <div
                    key={point.value}
                    className="grid grid-cols-[64px_1fr] border-b py-3 last:border-b-0"
                  >
                    <p className="text-foreground text-sm font-semibold tabular-nums">
                      {point.value}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {point.label}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground mt-5 text-sm leading-7">
                Scores próximos de 1 indicam baixa maturidade e maior risco de
                escala. Scores próximos de 5 indicam maior consistência,
                previsibilidade e capacidade de execução.
              </p>
            </section>

            <section id="leitura" className="scroll-mt-24 py-10">
              <h2 className="text-foreground text-2xl font-semibold tracking-tight">
                Leitura dos resultados
              </h2>
              <div className="mt-5 space-y-4 text-sm leading-7 text-muted-foreground">
                <p>
                  O resultado do OMDx deve ser lido como um mapa de decisão. O
                  score geral mostra a maturidade consolidada, mas a decisão
                  normalmente nasce da combinação entre dimensão crítica,
                  desalinhamento por camada e risco de escala.
                </p>
                <p>
                  Uma dimensão baixa indica onde a operação tende a perder
                  velocidade, qualidade ou previsibilidade. Um desalinhamento
                  alto entre camadas mostra que a empresa não está lendo o
                  mesmo problema da mesma forma. A prontidão para estruturação
                  sintetiza esses sinais em prioridade executiva.
                </p>
              </div>
              <div className="mt-8 border-l-2 border-l-primary pl-5">
                <p className="text-muted-foreground text-xs font-medium uppercase tracking-[0.12em]">
                  Diretriz de uso
                </p>
                <p className="text-foreground mt-2 text-sm leading-7">
                  O OMDx não deve ser usado como placar isolado. A função do
                  diagnóstico é revelar onde a empresa precisa alinhar,
                  padronizar ou aprofundar antes de aumentar complexidade.
                </p>
              </div>
              <div className="mt-8">
                <Button
                  variant="outline"
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
