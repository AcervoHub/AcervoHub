# Backend Bookspace

API Express com TypeScript, Prisma, PostgreSQL e busca de catálogo pelo Google Books.

## Configuração local

1. Copie `.env.example` para `.env` e configure `DATABASE_URL`, `JWT_SECRET` e `GOOGLE_BOOKS_API_KEY`.
2. Instale as dependências com `npm install` nesta pasta.
3. Aplique as migrações existentes com `npx prisma migrate deploy`.
4. Inicie a API com `npm run dev`.

O servidor fica em `http://localhost:3000`. A origem local do Vite (`http://localhost:5173`) é permitida por padrão. Ajuste `CORS_ORIGIN` se necessário.

Consulte [`../docs/rotas-api.md`](../docs/rotas-api.md) para endpoints e limites atuais.

