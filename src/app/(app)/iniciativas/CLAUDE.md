# /iniciativas

Área frontend de iniciativas, autenticada e exclusiva do app cliente; superadmin redireciona para Operação. A lista usa `AppTopbar` e `AppPage`, com criação em modal. O escopo do armazenamento é calculado no servidor a partir da sessão e da organização principal, igual ao escopo passado à sidebar. Sem banco ou API novos.

O detalhe em `/iniciativas/[id]` usa a interface de projetos escolhida na opção 2: atenção do gestor, tarefas, atividade e ativos relacionados. Metadados preservam o armazenamento existente; tarefas são uma demonstração sem integração ou persistência. A página raiz continua como lista de iniciativas.
