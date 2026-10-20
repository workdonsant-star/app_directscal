# Confirmação da própria identidade Slack

GET consulta status próprio; POST gera código aleatório de 256 bits com validade de dez minutos e armazena somente SHA-256; DELETE desvincula a própria conta e revoga desafios. Exige sessão definitiva cliente/admin com JWT e membership, sem parâmetros de empresa, pessoa ou workspace. Empresa derivada da sessão no servidor. Corpo de escrita vazio/objeto vazio; campos extras recusados. Nunca registrar código em log ou analytics. A confirmação acontece exclusivamente no processamento de DM assinada do Slack, revalidando pessoa e lease do evento durável.
