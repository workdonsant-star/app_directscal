# Distribuição isolada da demo

`prepare.mjs` monta em diretório novo um aplicativo Next contendo somente `/demo`, com redirect da raiz. Copia dependências transitivas de imports, tokens e assets explícitos. Recusa módulos de autenticação, banco, IA e integrações. Não copia `.env`, `.vercel`, `.git`, outras rotas ou fixtures operacionais. Usa dependências do lockfile existente; não inclui servidor original.

Uso: `node scripts/demo/prepare.mjs /private/tmp/directscal-demo-<id>`. O destino deve ser novo. Instalar com `npm ci`, validar/buildar e publicar esse diretório em projeto dedicado sem variáveis operacionais. O script preserva o SHA de origem em `demo-manifest.json`; mudanças não commitadas devem ser registradas no resultado da entrega.

O pacote para demo_directscal usa assetPrefix /demo-static, com logos, ícones e avatares também nesse namespace para não colidir com o app. Gera .gitignore, AGENTS.md, documentação local, scripts verificáveis e testes sem credenciais. O projeto principal recebe somente regras externas de /demo e /demo-static na Vercel; não precisa publicar código operacional para essa montagem.

O pacote inclui `src/lib/pdf/assets` e o tracing explícito da rota de relatório, para que fontes e capa também estejam disponíveis no download em produção.
