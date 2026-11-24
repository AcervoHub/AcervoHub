# Rotas da API

Base local: `http://localhost:3000/api`. As rotas de livros exigem `Authorization: Bearer <token>`.

## Saúde

| Método | Rota | Acesso | Uso |
| --- | --- | --- | --- |
| GET | `/health` | Público | Verifica se o servidor está ativo. |

## Usuários

| Método | Rota | Acesso | Entrada principal | Retorno |
| --- | --- | --- | --- | --- |
| POST | `/users/cadastro` | Público | `{ "username", "email", "password" }` | `{ message, user, token }` |
| POST | `/users/login` | Público | `{ "email", "password" }` | `{ user, token }` |
| GET | `/users/me` | Autenticado | — | `{ user }` |
| PUT | `/users/update` | Autenticado | `{ "name", "avatarUrl?" }` | `{ user }` |

O `username` aceita de 3 a 24 caracteres: letras minúsculas, números e `_`. A senha deve ter no mínimo 6 caracteres e até 72 bytes. O token é assinado com HS256.

## Livros

| Método | Rota | Entrada principal | Uso |
| --- | --- | --- | --- |
| GET | `/books/search?q=<termo>&page=1` | Query string | Pesquisa no Google Books e marca resultados já adicionados à estante. |
| POST | `/books/add` | `{ "googleBooksId", "status?", "isFavorite?", "rating?", "comment?", "startedAt?", "finishedAt?" }` | Adiciona livro à estante ou atualiza dados pessoais. |
| GET | `/books/my-books?page=1&pageSize=20&isFavorite=true` | Query string | Lista a estante do usuário; `isFavorite` é opcional. |

A busca requer termo de 2 a 100 caracteres. `page` e `pageSize` aceitam inteiros positivos de até 100. A nota aceita inteiros de 1 a 5 e comentários até 5.000 caracteres.

## Limites conhecidos para a integração atual

- Não há endpoint para remover um livro da estante.
- O dashboard consegue resumir livros lidos, fila e páginas quando esses dados foram registrados; ainda não há relatórios ou paginação total da estante no frontend.
- A tela de cadastro recebe nome completo, mas a API só aceita username. O frontend normaliza o nome em username para respeitar a validação atual.
- A edição de perfil persiste nome e foto; ainda não há campo de bio no modelo do backend.
