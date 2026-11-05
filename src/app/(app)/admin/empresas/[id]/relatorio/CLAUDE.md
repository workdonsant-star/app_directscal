# Diagnósticos em PDF da empresa

Esta aba do superadmin reutiliza `CustomerDocumentsWorkspace` em modo `reportsOnly`. `AdminCompanyReportsWorkspace` compõe as abas e o botão no cliente; a página de servidor passa somente dados serializáveis, conforme o limite do Next.js para Server/Client Components. Ela lista os PDFs já enviados para a organização da URL e oferece `Enviar PDF`. O mesmo endpoint de documentos valida PDF de até 10 MB, guarda o arquivo em bucket privado e publica o metadado imediatamente para a área Diagnósticos do cliente.

Não há editor de relatório, geração de HTML, integração com o gerador externo ou publicação de rascunho nesta rota. O upload é o documento final já preparado pela operação. A autorização vem de `requireAdminPageSession` e do endpoint de admin; o cliente usa download autenticado por empresa.
