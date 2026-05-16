import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getBottleneckReading,
  type QuestionResult,
} from "@/lib/data/omdx-overview-analytics";

type TopResearchBottlenecksProps = {
  questions: QuestionResult[];
};

const scoreFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export function TopResearchBottlenecks({
  questions,
}: TopResearchBottlenecksProps) {
  const bottlenecks = [...questions]
    .sort((a, b) => {
      if (a.criticalPercentage !== b.criticalPercentage) {
        return b.criticalPercentage - a.criticalPercentage;
      }

      return a.score - b.score;
    })
    .slice(0, 5);

  if (bottlenecks.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-foreground text-xl font-semibold tracking-tight">
          Top Gargalos da Pesquisa
        </h2>
        <p className="text-muted-foreground max-w-2xl text-sm">
          Perguntas com maior concentração de respostas críticas na escala
          Likert.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-base font-semibold">
            Gargalos específicos
          </CardTitle>
        </CardHeader>
        <CardContent className="divide-y px-0">
          {bottlenecks.map((question, index) => (
            <article
              key={question.questionId}
              className="grid gap-4 px-4 py-4 md:grid-cols-[auto_1fr_auto]"
            >
              <div className="text-muted-foreground w-8 pt-0.5 text-sm tabular-nums">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="min-w-0">
                <h3 className="text-foreground text-sm font-medium leading-snug">
                  {question.questionTitle}
                </h3>
                <p className="text-muted-foreground mt-1 text-xs">
                  Dimensão: {question.dimension}
                </p>
                <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                  {getBottleneckReading(question)}
                </p>
              </div>
              <div className="flex min-w-36 flex-col items-start gap-2 md:items-end">
                <Badge variant="outline" className="bg-muted/40">
                  {question.criticalPercentage}% críticas
                </Badge>
                <span className="text-muted-foreground text-xs tabular-nums">
                  Score {scoreFormatter.format(question.score)}
                </span>
              </div>
            </article>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
