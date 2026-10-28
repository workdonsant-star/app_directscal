import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

export function PublicResponseState({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <Card className="min-w-0 w-full max-w-xs sm:max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Solicite um novo link para a pessoa responsável pela coleta Maturidade.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
