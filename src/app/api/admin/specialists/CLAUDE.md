# Especialistas

GET, POST e PATCH exigem superadmin global. Nunca aceitar papel ou conta de acesso no payload. Nome, foto, cadastro e estados persistem em specialists. Exclusão é lógica para preservar autoria histórica. Fotos raster base64 são limitadas a 1 milhão de caracteres. Erros não retornam detalhes do banco.
