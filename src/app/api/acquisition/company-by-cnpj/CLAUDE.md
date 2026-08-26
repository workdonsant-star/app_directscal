# `/api/acquisition/company-by-cnpj` — consulta cadastral

## Propósito

Route Handler público usado pelo onboarding de campanhas para consultar um CNPJ na API Minha Receita antes de avançar o formulário.

## Convenções locais

- A integração externa ocorre somente no servidor, com timeout e sem cache.
- Validar os dígitos do CNPJ antes de consultar a API.
- Retornar somente os campos cadastrais normalizados usados pelo onboarding.
- A consulta feita pela interface é apenas antecipação de UX. A criação da conta deve consultar o CNPJ novamente no servidor e não confiar em razão social enviada pelo navegador.
- Mensagens de erro devem ser curtas, em pt-BR e sem expor a resposta bruta da integração.
