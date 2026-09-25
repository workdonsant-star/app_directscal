# Entregas administrativas

## Propósito

Persistir o trabalho editorial e a publicação das entregas produzidas a partir de diagnósticos encerrados.

## Convenções

- Toda mutação exige sessão `superadmin`.
- O identificador da entrega é o próprio `diagnostic_id`.
- O handler valida especialista e action points contra o catálogo administrativo antes de gravar.
- A camada de dados determina o status e registra a publicação no Supabase; o cliente não envia um status arbitrário.
- Uma entrega publicada continua publicada quando recebe uma atualização posterior de conteúdo.
