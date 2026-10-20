# Senha da própria conta

POST exige sessão definitiva de cliente/admin e JWT do painel. Ator vem somente da sessão; payload estrito recebe senha atual e nova senha confirmada. Apenas conta que já usa senha pode alterar. Rate limit de cinco tentativas em quinze minutos, comparação scrypt, controle de concorrência e transação privada. Sucesso revoga sessões e exige entrada novamente. Não cria senha para conta Google nem altera credencial global gerida por configuração.
