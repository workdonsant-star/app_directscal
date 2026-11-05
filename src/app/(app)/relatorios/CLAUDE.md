# `/relatorios` — Diagnósticos do cliente

A entrada `Diagnósticos` da sidebar mostra somente PDFs enviados pelo superadmin para a organização do cliente. Os metadados vêm de `listCustomerDocumentsForUser(userId, "report")`, ordenados por publicação. `UploadedReportsList` mantém o card original da listagem de relatórios e faz o card inteiro baixar o PDF via `CustomerDocumentDownloadLink` e a rota autenticada `/api/customer-documents/[id]`, que confere vínculo à organização e responde com attachment privado. Sem PDFs, a página mostra um estado vazio em card.

O fluxo é PDF pronto: o superadmin abre a empresa, aba Diagnósticos, e usa `Enviar PDF`. Rotas legadas de leitura de entregas continuam isoladas, mas não compõem esta listagem.
