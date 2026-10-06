# Padrão de tabelas e botões seletores

Decisão aprovada pelo usuário em 04/10/2026: todas as tabelas e botões seletores criados a partir desta alteração devem seguir os componentes atualizados do [Figma — DirectScal App, frame 252:2](https://www.figma.com/design/oApRszoNt9EgWVZbF8C7wN/DirectScal-App?node-id=252-2). O frame contém duas tabelas: Situações que precisam de você (`252:438`) e Em produção (`252:523`). Lista de seletores: `252:79`.

## Tabelas

Use os primitives de `src/components/ui/table.tsx` com `Table variant="operational"`.

- Cabeçalho neutro de 44px, texto de 14px/20px medium e raio de 5px nos quatro cantos externos.
- Padding horizontal de 16px nas células; linhas simples de 55px, com crescimento quando o conteúdo exigir.
- Divisória inferior de 0,5px entre linhas do corpo, sem divisória após a última. Sem borda sob o cabeçalho, contorno externo, Card ou preenchimento no hover.
- Corpo em 14px/20px. Informações principais podem usar medium; secundárias usam a hierarquia existente. Números alinháveis usam `tabular-nums`.
- A largura acompanha o espaço disponível; a largura de 1584px da referência não é uma restrição da interface. O container do primitive permite rolagem horizontal local.

As colunas, status e ações devem representar o domínio da tela. Os exemplos de perguntas e pontuações do Figma não substituem tarefas, executores e prazos no projeto. Ordenação, filtros e seleção de registros não são adicionados pela variante visual.

```tsx
<Table variant="operational">
  <TableHeader>
    <TableRow>
      <TableHead>Tarefa</TableHead>
      <TableHead>Executor</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell className="font-medium">Validar navegação</TableCell>
      <TableCell>Responsável pela entrega</TableCell>
    </TableRow>
  </TableBody>
</Table>
```

Não adicionar um wrapper com `border` ou `rounded-lg`. Título e ações permanecem no fluxo da página. A variante `default` conserva tabelas existentes; novas tabelas devem declarar `operational`. Esta entrega aplica o padrão às duas tabelas da aba Precisam de atenção e à lista Todas as tarefas do detalhe do projeto, sem migração ampla das telas existentes. A primeira seção também é uma tabela, sem os artigos de intervenção da referência anterior; clicar na tarefa abre os critérios ou a resolução de bloqueio no painel existente. Espaçamento de 20px entre descrição e tabela e de 40px entre as duas seções.

## Botões seletores

Use `Tabs`, `TabsList variant="selector"`, `TabsTrigger` e `TabsContent` de `src/components/ui/tabs.tsx` para alternar seções.

- Altura de 32px, padding horizontal de 6px e intervalo de 32px entre opções.
- Opção ativa com fundo neutro, raio de 6px e texto foreground medium de 14px/20px.
- Opções inativas transparentes e com texto secundário; sem faixa preenchida envolvendo o grupo, borda inferior, sombra ou sublinhado azul.
- Preserve semântica de abas, foco visível e navegação por teclado do Base UI. Quando necessário, envolva a lista em um container com `overflow-x-auto`.

```tsx
<Tabs defaultValue="tarefas">
  <div className="overflow-x-auto">
    <TabsList variant="selector">
      <TabsTrigger value="tarefas">Todas as tarefas</TabsTrigger>
      <TabsTrigger value="atividade">Atividade</TabsTrigger>
    </TabsList>
  </div>
  <TabsContent value="tarefas">{/* Conteúdo das tarefas */}</TabsContent>
  <TabsContent value="atividade">{/* Histórico */}</TabsContent>
</Tabs>
```

Seletores dropdown permanecem com o primitive `Select`; a referência fornecida para botões seletores é o grupo de quatro abas. As variantes legadas `default` e `line` permanecem disponíveis para consumidores anteriores.

## Tokens e verificação

No Figma, o cabeçalho utiliza uma variável chamada muted com valor claro `#fafafa`; o seletor ativo utiliza secondary com valor `#f4f4f4`. No app atual, essas superfícies correspondem respectivamente a `bg-secondary` e `bg-muted`. A implementação usa esses tokens existentes e suas versões escuras, sem hex nos componentes ou alteração da paleta global.

Critérios de aceite: conferir cabeçalho de 44px, linhas simples de 55px, quatro cantos de 5px, divisórias de 0,5px, ausência de borda externa e hover preenchido; conferir seletores de 32px, gap de 32px, opção ativa neutra e ausência de sublinhado. Validar troca de abas por teclado e mouse, abertura da tarefa e os dois temas no navegador. Comparar os componentes com os recortes equivalentes do Figma; o restante do frame não amplia o escopo desta alteração.

## Padronização em 06/10/2026

A referência atual é a tabela das Dimensões enviada pelo usuário: `Table` aplica `operational` por padrão, com cabeçalho `bg-muted` e peso medium. Todas as listagens existentes, tabelas de leitura RichText, prévias e editor seguem este padrão sem contorno externo. A última linha não tem divisória inferior; textos longos podem ampliar a altura. Tabelas auxiliares `sr-only` dos gráficos mantêm sua finalidade acessível. Esta decisão substitui a preservação visual das listagens legadas descrita acima.
