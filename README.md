# Bookspace — AcervoHub

Aplicação web para explorar livros e organizar uma estante pessoal.

## Tecnologias atuais

- Frontend: React, TypeScript e Vite.
- Backend: Express, TypeScript, Prisma e PostgreSQL.
- Catálogo: Google Books API.

## Executar localmente

1. Configure o backend conforme [`backend/README.md`](backend/README.md) e inicie-o na porta `3000`.
2. Copie `frontend/.env.example` para `frontend/.env` se precisar alterar a URL da API.
3. Em `frontend/`, instale as dependências com `npm install` e execute `npm run dev`.

## Estado da integração

Cadastro, login, busca no catálogo, favoritos, marcação de livros lidos, estante e resumos de leitura usam as rotas atuais do backend. O backend ainda não oferece persistência para editar perfil, bio ou remover livros.

Consulte [`docs/rotas-api.md`](docs/rotas-api.md) para os contratos e limitações atuais.
