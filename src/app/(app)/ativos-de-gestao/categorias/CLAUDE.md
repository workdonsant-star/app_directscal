# Categorias adicionais de ativos de gestão

`[categoria]/page.tsx` abre categorias cadastradas nos ativos publicados que não possuem atalho fixo. O parâmetro é a chave normalizada retornada por `management-asset-categories.ts`; categorias inexistentes retornam 404. Sem categoria agrupa ativos sem classificação. Usa o mesmo workspace e as mesmas restrições de acesso das quatro categorias principais.
