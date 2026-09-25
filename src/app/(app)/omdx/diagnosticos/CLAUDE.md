# `/omdx/diagnosticos` — Área operacional

## Propósito

Página autenticada para listar, filtrar, criar e configurar diagnósticos Maturidade.

## Convenções locais

- Usar breadcrumb `Overview / Diagnósticos`.
- Manter o seletor de status e a ação `Criar diagnóstico` na `AppTopbar`, antes do sino; o corpo da página começa diretamente pela mensagem de retorno ou pela tabela.
- Usar o mesmo recuo horizontal das páginas de Dimensões (`px-6 lg:px-10`), com conteúdo em largura total e sem `max-width` ou centralização adicional.
- A tabela segue o mesmo tratamento visual da tabela de perguntas em Dimensões: raio de 5 px, contorno `ring-foreground/10`, cabeçalho `bg-muted/30`, células `px-4 py-4` e ausência de sombra. Preserve overflow horizontal para as dez colunas operacionais.
- Clicar em uma linha ou no nome de um diagnóstico abre `/omdx/[id]/compartilhar`; botões de copiar link e o menu de ações mantêm seus comportamentos próprios.
- Manter criação e configuração em drawer lateral, sem página dedicada.
- Exibir a empresa como informação bloqueada no drawer. O valor vem do nome fantasia resolvido por `getProfileSettingsData()`, com fallback para o nome oficial da empresa.
- Usar `DiagnosticsWorkspace` como componente client para controlar filtros, ações e drawer.
- Persistir criação, configuração, ativação e exclusão via Route Handlers Maturidade e Supabase.
- O drawer usa três etapas: informações, seleção de lideranças já ativas na estrutura e revisão.
- Rascunhos podem ser salvos sem liderança; ativação exige ao menos uma liderança ativa.
- A lista mostra o criador e os setores envolvidos. O Superadmin da empresa vê todos os diagnósticos; um Admin vê os que criou e aqueles aos quais foi atribuído.
- A ativação cria um link de Fundador, um link geral de Liderança e um link de Time por setor selecionado. O link de Fundador é exclusivo do Superadmin da empresa.
