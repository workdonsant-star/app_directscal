import Image from "next/image";
import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  Clock3,
  MoveDownRight,
} from "lucide-react";

const symptoms = [
  "Decisões que deveriam acontecer dentro das áreas continuam subindo para o fundador.",
  "Líderes existem, mas ainda dependem de validação constante.",
  "Projetos atrasam, prioridades mudam e o time precisa de alinhamentos frequentes.",
  "Processos importantes continuam concentrados na cabeça de algumas pessoas.",
  "Você precisa acompanhar de perto para garantir qualidade e velocidade.",
];

const lessonTopics = [
  {
    title:
      "Por que a empresa continua dependente do fundador mesmo depois de contratar equipe e liderança",
    description:
      "Como a falta de clareza em papéis, decisões e responsabilidades cria centralização sem que isso seja percebido.",
  },
  {
    title:
      "Os principais sinais de que sua estrutura de gestão não acompanhou o crescimento",
    description:
      "O que observar em liderança, processos, comunicação, gestão do trabalho, indicadores e governança.",
  },
  {
    title: "Por que algumas soluções comuns não resolvem o problema",
    description:
      "Contratar mais pessoas, trocar ferramentas, aumentar reuniões ou simplesmente cobrar mais autonomia pode aliviar sintomas, mas não corrige a causa.",
  },
  {
    title:
      "O que muda na gestão quando a empresa entra em um estágio mais complexo",
    description:
      "Quais mecanismos precisam existir para que decisões, execução e acompanhamento deixem de depender de acordos informais.",
  },
];

const audienceSignals = [
  "Já possui equipe estruturada e alguma camada de liderança.",
  "Tem faturamento, operação rodando e capacidade de crescimento.",
  "Ainda depende de você para decisões, cobranças, alinhamentos ou resolução de problemas.",
  "Sua rotina ficou mais complexa em vez de mais estratégica.",
];

const proof = [
  {
    value: "R$ 3,6 mi",
    description: "de potencial de geração de receita ampliado por clientes",
  },
  {
    value: "70%",
    description: "de aumento médio na capacidade de gestão",
  },
  {
    value: "20%",
    description: "de evolução média na maturidade da liderança",
  },
];

type ExecutiveClassLandingProps = {
  registrationUrl: string;
};

function CtaLink({
  children,
  className = "",
  registrationUrl,
}: {
  children: React.ReactNode;
  className?: string;
  registrationUrl: string;
}) {
  const isExternal = registrationUrl.startsWith("http");

  return (
    <Link
      href={registrationUrl}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-[var(--action-button-shadow)] outline-none transition-[background-color,transform] duration-180 hover:bg-brand-600 active:translate-y-px focus-visible:ring-3 focus-visible:ring-ring/50 ${className}`}
      {...(isExternal ? { target: "_blank", rel: "noreferrer" } : {})}
    >
      {children}
      <ArrowRight aria-hidden="true" className="size-4" />
    </Link>
  );
}

function FounderBottleneckVisual() {
  return (
    <div className="relative isolate min-h-[430px] overflow-hidden rounded-2xl border border-foreground/10 bg-gray-100 p-5 text-gray-10 sm:min-h-[500px] sm:p-8">
      <div className="absolute inset-x-0 top-0 h-px bg-gray-70" />
      <div className="flex items-center justify-between text-xs text-gray-40">
        <span>Mapa de dependência</span>
        <span className="tabular-nums">01 / 06</span>
      </div>

      <svg
        viewBox="0 0 520 430"
        className="absolute inset-x-0 bottom-0 h-[88%] w-full"
        role="img"
        aria-label="Decisões de diferentes áreas convergindo para o fundador"
      >
        <g fill="none" stroke="currentColor" className="text-gray-70">
          <path d="M105 77 C175 92 190 160 258 215" />
          <path d="M410 72 C345 103 328 162 268 214" />
          <path d="M68 237 C142 230 176 224 241 220" />
          <path d="M451 239 C375 228 343 225 278 220" />
          <path d="M156 282 C198 274 222 252 252 235" />
          <path d="M364 282 C326 273 301 250 269 235" />
        </g>
        <g fill="currentColor" className="text-gray-50">
          <circle cx="105" cy="77" r="4" />
          <circle cx="410" cy="72" r="4" />
          <circle cx="68" cy="237" r="4" />
          <circle cx="451" cy="239" r="4" />
          <circle cx="156" cy="282" r="4" />
          <circle cx="364" cy="282" r="4" />
        </g>
        <circle cx="260" cy="220" r="68" className="fill-primary" />
        <circle
          cx="260"
          cy="220"
          r="86"
          fill="none"
          stroke="currentColor"
          strokeDasharray="3 8"
          className="text-brand-300"
        />
        <text
          x="260"
          y="214"
          textAnchor="middle"
          className="fill-primary-foreground font-heading text-[20px] font-semibold"
        >
          Fundador
        </text>
        <text
          x="260"
          y="239"
          textAnchor="middle"
          className="fill-primary-foreground text-[12px]"
        >
          ponto de decisão
        </text>
        <g className="fill-gray-30 text-[12px]">
          <text x="82" y="59">Comercial</text>
          <text x="389" y="54">Produto</text>
          <text x="32" y="220">Operação</text>
          <text x="425" y="222">Pessoas</text>
          <text x="124" y="308">Financeiro</text>
          <text x="341" y="308">Projetos</text>
        </g>
      </svg>

      <div className="absolute bottom-5 left-5 max-w-44 text-xs leading-5 text-gray-40 sm:bottom-8 sm:left-8">
        Quando o sistema não decide, todas as linhas voltam para o mesmo ponto.
      </div>
    </div>
  );
}

export function ExecutiveClassLanding({
  registrationUrl,
}: ExecutiveClassLandingProps) {
  return (
    <main className="min-h-screen bg-background text-foreground selection:bg-brand-200 selection:text-gray-100">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-[1300px] items-center justify-between px-5 sm:px-8 lg:px-10">
          <Link href="/aula-executiva" aria-label="Directscal, início">
            <Image
              src="/directscal-logo.svg"
              alt="Directscal"
              width={704}
              height={99}
              className="h-auto w-32 dark:hidden"
              priority
            />
            <Image
              src="/directscal-logo-dark.svg"
              alt="Directscal"
              width={704}
              height={99}
              className="hidden h-auto w-32 dark:block"
              priority
            />
          </Link>

          <div className="flex items-center gap-5">
            <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
              <Clock3 aria-hidden="true" className="size-4" />
              Aula executiva, 45 minutos
            </div>
            <div className="hidden sm:block">
              <CtaLink
                registrationUrl={registrationUrl}
                className="min-h-10 px-4 py-2"
              >
                Assistir à aula
              </CtaLink>
            </div>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-border">
        <div className="mx-auto grid max-w-[1300px] gap-12 px-5 pb-18 pt-14 sm:px-8 sm:pb-24 sm:pt-20 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.85fr)] lg:items-center lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
          <div className="max-w-[760px]">
            <div className="mb-8 flex items-center gap-3 text-sm font-medium text-primary">
              <span className="size-2 rounded-full bg-auth-gradient-matcha" />
              Aula executiva sobre estrutura de gestão
            </div>
            <h1 className="max-w-[760px] font-heading text-[clamp(2.75rem,5.2vw,5rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
              Sua empresa cresceu. Por que ela ainda depende tanto de você?
            </h1>
            <p className="mt-8 max-w-[660px] text-lg leading-8 text-muted-foreground sm:text-xl sm:leading-9">
              Entenda os gargalos de gestão que fazem uma operação com equipe,
              líderes e faturamento continuar funcionando com a lógica de uma
              empresa pequena.
            </p>
            <p className="mt-5 max-w-[640px] text-base leading-7 text-foreground/80">
              Em 45 minutos, você vai entender por que decisões, problemas
              operacionais e alinhamentos continuam chegando no fundador mesmo
              depois da empresa crescer, contratar pessoas e formar uma camada
              de liderança.
            </p>
            <div className="mt-9 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div className="hidden sm:block">
                <CtaLink registrationUrl={registrationUrl}>
                  Quero assistir à aula
                </CtaLink>
              </div>
              <a
                href="#contexto"
                className="inline-flex min-h-11 items-center gap-2 rounded-sm px-2 text-sm font-medium text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                Entender o problema
                <ArrowDown aria-hidden="true" className="size-4" />
              </a>
            </div>
          </div>

          <FounderBottleneckVisual />
        </div>
      </section>

      <section aria-labelledby="proof-title" className="bg-gray-100 text-gray-10">
        <div className="mx-auto max-w-[1300px] px-5 py-16 sm:px-8 sm:py-20 lg:px-10">
          <div className="grid gap-10 border-b border-gray-80 pb-10 lg:grid-cols-[0.8fr_2.2fr] lg:items-end">
            <h2 id="proof-title" className="max-w-sm text-xl leading-7 font-medium">
              Estruturação mensurada na operação, não apenas no discurso.
            </h2>
            <p className="max-w-2xl text-sm leading-6 text-gray-40 lg:justify-self-end">
              Resultados observados em empresas acompanhadas pela Directscal.
              O ponto de partida é tornar visível o que hoje depende de pessoas,
              acordos informais e intervenção do fundador.
            </p>
          </div>
          <dl className="grid gap-10 pt-12 sm:grid-cols-3 sm:gap-6">
            {proof.map((item) => (
              <div key={item.value} className="max-w-xs">
                <dt className="font-heading text-[clamp(2.75rem,5vw,5rem)] leading-none font-semibold tracking-[-0.04em] tabular-nums">
                  {item.value}
                </dt>
                <dd className="mt-4 text-sm leading-6 text-gray-40">
                  {item.description}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section id="contexto" className="scroll-mt-20 border-b border-border">
        <div className="mx-auto grid max-w-[1300px] gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-10 lg:py-36">
          <div>
            <p className="text-sm font-medium text-primary">O padrão</p>
            <h2 className="mt-4 max-w-xl text-[clamp(2rem,3.7vw,3.5rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-balance">
              Você contratou mais pessoas. Criou áreas. Talvez já tenha líderes.
            </h2>
            <p className="mt-7 max-w-lg text-lg leading-8 text-muted-foreground">
              Mas a operação continua dependendo demais de você. Isso normalmente
              não acontece porque falta esforço, gente boa ou ferramenta.
            </p>
            <p className="mt-5 max-w-lg text-lg leading-8 font-medium">
              A empresa cresceu em faturamento, pessoas e complexidade. A
              estrutura de gestão continuou praticamente a mesma.
            </p>
          </div>

          <ol className="border-t border-border">
            {symptoms.map((symptom, index) => (
              <li
                key={symptom}
                className="grid grid-cols-[2rem_1fr] gap-4 border-b border-border py-6 sm:grid-cols-[3rem_1fr] sm:py-7"
              >
                <span className="pt-1 text-xs text-muted-foreground tabular-nums">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <p className="max-w-2xl text-lg leading-7 sm:text-xl sm:leading-8">
                  {symptom}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="overflow-hidden bg-brand-50 dark:bg-gray-90">
        <div className="mx-auto max-w-[1300px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end lg:gap-20">
            <div>
              <p className="text-sm font-medium text-primary">Complexidade</p>
              <h2 className="mt-4 max-w-3xl text-[clamp(2.25rem,4.5vw,4.5rem)] leading-[1.02] font-semibold tracking-[-0.04em] text-balance">
                O problema aparece quando a estrutura de gestão fica menor do que a operação.
              </h2>
            </div>
            <p className="max-w-xl text-lg leading-8 text-muted-foreground">
              Quanto mais a empresa cresce, mais relações, decisões, projetos e
              dependências precisam ser coordenados. Sem novos mecanismos, o
              fundador vira o elo entre todas essas partes.
            </p>
          </div>

          <div className="mt-16 border-y border-foreground/15 py-10 sm:mt-20 sm:py-14">
            <div className="grid gap-9 sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
              {[
                ["5", "Proximidade e comunicação informal"],
                ["20", "Papéis, processos e critérios explícitos"],
                ["50", "Governança, indicadores e coordenação"],
              ].map(([people, mechanism], index) => (
                <div key={people} className="contents">
                  <div>
                    <div className="font-heading text-6xl leading-none font-semibold tracking-[-0.04em] text-primary tabular-nums sm:text-7xl">
                      {people}
                    </div>
                    <p className="mt-3 max-w-52 text-sm leading-6 text-muted-foreground">
                      pessoas: {mechanism}
                    </p>
                  </div>
                  {index < 2 ? (
                    <MoveDownRight
                      aria-hidden="true"
                      className="hidden size-6 text-muted-foreground sm:block"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>

          <p className="mt-10 max-w-3xl text-xl leading-8 font-medium sm:text-2xl sm:leading-9">
            É nesse ponto que crescer começa a aumentar a complexidade mais rápido
            do que a empresa consegue absorver.
          </p>
        </div>
      </section>

      <section className="border-y border-border bg-background">
        <div className="mx-auto max-w-[1300px] px-5 py-20 sm:px-8 sm:py-28 lg:px-10 lg:py-36">
          <div className="grid gap-12 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <p className="text-sm font-medium text-primary">Em 45 minutos</p>
              <h2 className="mt-4 max-w-md text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.04em]">
                Nesta aula, você vai entender
              </h2>
            </div>

            <ol className="border-t border-border">
              {lessonTopics.map((topic, index) => (
                <li
                  key={topic.title}
                  className="grid gap-5 border-b border-border py-8 sm:grid-cols-[3rem_1fr] sm:gap-6 sm:py-10"
                >
                  <span className="text-sm text-primary tabular-nums">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="max-w-2xl text-xl leading-8 font-semibold sm:text-2xl sm:leading-9">
                      {topic.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                      {topic.description}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <section className="bg-gray-100 text-gray-10">
        <div className="mx-auto grid max-w-[1300px] gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.9fr_1.1fr] lg:gap-24 lg:px-10 lg:py-36">
          <div>
            <p className="text-sm font-medium text-brand-300">Para quem é</p>
            <h2 className="mt-4 max-w-xl text-[clamp(2.25rem,4vw,3.75rem)] leading-[1.05] font-semibold tracking-[-0.04em] text-balance">
              Para empresários que já construíram uma operação relevante.
            </h2>
          </div>
          <ul className="grid content-start gap-0 border-t border-gray-80">
            {audienceSignals.map((signal) => (
              <li
                key={signal}
                className="grid grid-cols-[1.25rem_1fr] gap-4 border-b border-gray-80 py-6 text-lg leading-7 text-gray-20"
              >
                <Check aria-hidden="true" className="mt-1 size-4 text-auth-gradient-matcha" />
                {signal}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="border-b border-border">
        <div className="mx-auto grid max-w-[1300px] gap-14 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-24 lg:px-10 lg:py-36">
          <h2 className="max-w-3xl text-[clamp(2.25rem,4.6vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
            Sua empresa pode estar crescendo com uma estrutura de gestão que já ficou para trás.
          </h2>
          <div className="max-w-xl space-y-6 text-lg leading-8 text-muted-foreground">
            <p>
              Esse é um problema difícil de perceber de dentro da operação,
              porque a empresa continua vendendo, contratando e entregando.
            </p>
            <p>
              Aos poucos, aparecem retrabalho, lentidão nas decisões, dependência
              de pessoas específicas, desalinhamento entre áreas e excesso de
              centralização.
            </p>
            <p className="font-medium text-foreground">
              Na aula, você vai aprender a diferenciar problemas pontuais de
              vulnerabilidades estruturais de gestão.
            </p>
          </div>
        </div>
      </section>

      <section id="inscricao" className="bg-primary text-primary-foreground">
        <div className="mx-auto grid max-w-[1300px] gap-10 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1fr_auto] lg:items-end lg:px-10 lg:py-28">
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-primary-foreground/75">
              <Clock3 aria-hidden="true" className="size-4" />
              Aula executiva, 45 minutos
            </div>
            <h2 className="mt-5 max-w-4xl text-[clamp(2.25rem,4.8vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.045em] text-balance">
              Entenda por que a operação ainda volta para você.
            </h2>
          </div>
          <Link
            href={registrationUrl}
            className="inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-gray-100 px-7 py-3.5 text-sm font-semibold text-gray-10 shadow-[var(--action-button-shadow)] outline-none transition-[background-color,transform] duration-180 hover:bg-gray-90 active:translate-y-px focus-visible:ring-3 focus-visible:ring-primary-foreground/60"
            {...(registrationUrl.startsWith("http")
              ? { target: "_blank", rel: "noreferrer" }
              : {})}
          >
            Garantir minha inscrição
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="bg-background">
        <div className="mx-auto grid max-w-[1300px] gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-[0.7fr_1.3fr] lg:gap-24 lg:px-10">
          <p className="text-sm font-medium text-primary">Sobre a Directscal</p>
          <div className="max-w-3xl">
            <h2 className="text-2xl leading-9 font-semibold sm:text-3xl sm:leading-10">
              A Directscal estrutura a gestão de empresas em crescimento.
            </h2>
            <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
              Diagnosticamos vulnerabilidades e construímos os mecanismos
              necessários para organizar decisões, responsabilidades, processos,
              liderança, execução e acompanhamento da operação.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-[1300px] flex-col gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-10">
          <Image
            src="/directscal-logo.svg"
            alt="Directscal"
            width={704}
            height={99}
            className="h-auto w-28 opacity-70 dark:hidden"
          />
          <Image
            src="/directscal-logo-dark.svg"
            alt="Directscal"
            width={704}
            height={99}
            className="hidden h-auto w-28 opacity-70 dark:block"
          />
          <p>Estruturação de gestão para empresas em crescimento.</p>
        </div>
      </footer>

      <div className="fixed inset-x-4 bottom-4 z-40 sm:hidden">
        <CtaLink registrationUrl={registrationUrl} className="w-full">
          Quero assistir à aula
        </CtaLink>
      </div>
    </main>
  );
}
