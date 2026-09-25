# `/aula-executiva` — Landing da aula de gestão

## Propósito

Landing pública, sem autenticação, que transforma o reconhecimento da dependência do fundador em inscrição para uma aula executiva de 45 minutos.

## Convenções locais

- Não apresentar o Programa Executivo antes da inscrição.
- Manter uma única conversão: assistir à aula.
- Exibir prova quantitativa logo após o hero.
- O destino dos CTAs vem de `NEXT_PUBLIC_EXECUTIVE_CLASS_REGISTRATION_URL`; sem configuração, usa `/a/omdx-site` para preservar um caminho funcional no ambiente local.
- A página usa `ExecutiveClassLanding`, em `src/components/marketing/`.
- Superfície pública obrigatoriamente validada em desktop e mobile, claro e escuro.

