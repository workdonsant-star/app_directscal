# Preferências de navegação dos ativos

PUT exclusivo do dono cliente, sem intenção temporária de aquisição/convite. Organização resolvida pelo perfil autenticado, nunca recebida do navegador. Payload estrito com ordem sem duplicatas e catálogo fechado de ícones. Grava apenas apresentação compartilhada da empresa via service role; não altera categorias, documentos ou permissões. Respostas sem cache; erros não expõem detalhes do banco.

- PUT agora chama save_asset_navigation_preferences: merge atômico de order/icons, preservando categories. Payload não aceita categories; POST/PATCH de asset-categories é a única escrita do registro. Resposta inclui preferências completas vigentes.
