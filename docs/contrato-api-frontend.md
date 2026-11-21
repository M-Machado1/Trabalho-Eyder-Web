# Contrato da API usado pelo frontend

O frontend só conversa com `/api/...`. Estes são o formato e os códigos de status que ele espera do backend.
Os nomes dos campos estão em `lib/types.ts`.

Erros: sempre `{ "error": "mensagem em português" }` (o frontend mostra essa mensagem na tela).

| Método | Rota | Parâmetros | Resposta de sucesso |
|---|---|---|---|
| GET | `/api/books` | `q` (obrigatório, mín. 2 caracteres), `type` (`title` ou `author`), `page` (a partir de 1) | 200 `{ items: BookSummary[], total, page, page_size, total_pages }` |
| GET | `/api/books/[workId]` | — | 200 `BookDetail` (404 se não existir) |
| GET | `/api/authors/[authorId]` | — | 200 `AuthorDetail` (404 se não existir) |
| GET | `/api/bookshelf` | — | 200 `ShelfItem[]` |
| POST | `/api/bookshelf` | corpo `{ work_id, title, cover_url, status }` | 201 `ShelfItem` (409 se `work_id` já existe) |
| PATCH | `/api/bookshelf/[id]` | corpo com `status` e/ou `note` (`note: null` limpa a anotação) | 200 `ShelfItem` atualizado (400 se inválido) |
| DELETE | `/api/bookshelf/[id]` | — | 204 sem corpo |

Observações para o backend:

- `cover_url` é `null` quando o livro não tem capa.
- `description` e `bio` chegam como texto simples (`""` quando não existem); a normalização é feita no backend.
- `authors` em `BookSummary` é uma lista de nomes (pode ser vazia).
- `created_at` pode vir como `YYYY-MM-DD HH:MM:SS` (formato do SQLite).
