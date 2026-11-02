# Demo na administração

`/admin/demo` é a central de acesso à apresentação isolada para o superadmin global. Herda a autorização de `admin/layout.tsx` e o shell autenticado. A página só oferece links para a demo pública e explica seus limites; não carrega dados de clientes, não altera o estado da demo e não mistura sua navegação com a sidebar do cliente.

A apresentação em `/demo` continua usando fixtures e estado local reiniciável. A distribuição isolada e os endereços estão documentados em `docs/ambiente-demo.md`.
