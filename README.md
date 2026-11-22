# Trabalho-Eyder-Web — Catálogo de Livros

Trabalho da 2ª Avaliação de Programação Web (UESPI), Problema 07.

## Integrantes

- Murilo Linhares Pereira Val Machado
- Bruno Vinicius dos Reis Souza

Contato: murilomachado@aluno.uespi.br

## Projeto

**Catálogo de Livros**: aplicação web para buscar livros por título ou autor, consultar os detalhes de obras e autores e manter uma estante pessoal de leitura.

Principais funcionalidades:

- Busca paginada de livros por título ou autor
- Detalhe da obra: capa, autores, ano da primeira publicação e descrição
- Página do autor: foto, datas de nascimento e morte, biografia e lista de obras
- Estante pessoal: adicionar livro, alterar status (quero ler, lendo, lido), editar ou limpar anotação e remover livro

## API externa

Os dados de livros e autores vêm da **Open Library** (`https://openlibrary.org`). As consultas são feitas em tempo de execução, somente pelo backend (Route Handlers em `app/api/`). O banco local não guarda cópia desses dados: armazena apenas o que o usuário criou.

Toda requisição à Open Library envia o cabeçalho:

```
User-Agent: CatalogoLivros/1.0 (murilomachado@aluno.uespi.br)
```

## Endpoints do backend

Todas as respostas são JSON. Erros seguem o formato `{ "error": "mensagem em português" }`.

| Método | Endpoint | Finalidade | Parâmetros de consulta / corpo |
|---|---|---|---|
| GET | `/api/books` | Busca paginada de livros | `q` (obrigatório, mínimo 2 caracteres), `type` (`title` \| `author`, padrão `title`), `page` (inteiro ≥ 1, padrão 1). `page_size` fixo em 20. |
| GET | `/api/books/[workId]` | Detalhe de uma obra | `workId` no formato `OL\d+W` (ex.: `OL27482W`) |
| GET | `/api/authors/[authorId]` | Dados do autor e suas obras | `authorId` no formato `OL\d+A` (ex.: `OL93286A`) |
| GET | `/api/bookshelf` | Listar a estante (mais recentes primeiro) | — |
| POST | `/api/bookshelf` | Incluir livro na estante | Corpo: `{ work_id, title, cover_url, status? }` |
| PATCH | `/api/bookshelf/[id]` | Atualizar status e/ou anotação | Corpo com apenas `status` e/ou `note` |
| DELETE | `/api/bookshelf/[id]` | Remover livro da estante | — |

Regras do `PATCH`: só `status` e `note` são aceitos (qualquer outro campo retorna 400). `note` é texto de até 500 caracteres ou `null`; texto vazio ou só com espaços é gravado como `null`.

Códigos de status:

| Situação | Código |
|---|---|
| Consulta com sucesso | 200 |
| Registro criado | 201 |
| Registro removido | 204 |
| Parâmetro ausente ou inválido | 400 |
| Recurso inexistente | 404 |
| Registro duplicado | 409 |
| Falha na comunicação com a API externa | 502 |
| Erro interno | 500 |

## Banco de dados

- Arquivo: `data/app.db`, criado automaticamente na primeira execução e fora do git
- SQLite com `better-sqlite3`, journal padrão (`DELETE`), sem WAL
- Tabela `bookshelf`:

| Campo | Tipo | Constraints | Editável |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Não |
| work_id | TEXT | NOT NULL, UNIQUE | Não |
| title | TEXT | NOT NULL | Não |
| cover_url | TEXT | aceita NULL (livro sem capa) | Não |
| status | TEXT | NOT NULL, DEFAULT 'want_to_read', CHECK ('want_to_read', 'reading', 'read') | Sim |
| note | TEXT | CHECK (note IS NULL OR length(note) <= 500) | Sim |
| created_at | TEXT | NOT NULL, DEFAULT (datetime('now','localtime')) | Não |

`work_id` é `UNIQUE`: adicionar um livro que já está na estante retorna 409.

### Registros iniciais

Definidos em `lib/db.ts` e inseridos apenas quando o banco é criado:

| work_id | Título | Status | Anotação |
|---|---|---|---|
| OL27482W | The Hobbit | want_to_read | Pretendo ler em breve. |
| OL66554W | Pride and Prejudice | reading | Lendo agora, gostando muito. |
| OL1168083W | Nineteen Eighty-Four | read | — |
| OL450063W | Frankenstein; or, The Modern Prometheus | want_to_read | — |
| OL1003040W | Dom Casmurro | read | Clássico de Machado de Assis. |

## Tecnologias

- Next.js 16 (App Router e Route Handlers), React 19, TypeScript em modo estrito
- CSS puro (`app/globals.css`)
- SQLite com `better-sqlite3` (SQL puro, sem ORM)
- `fetch` nativo para HTTP
- Node.js: `v24.21.0` (o `better-sqlite3` exige Node 22 ou superior)

## Como executar

```
npm install
npm run dev
```

A aplicação fica em `http://localhost:3000`. Na primeira execução, o banco é criado com os registros iniciais.

Para restaurar o banco ao estado inicial, apague `data/app.db` e reinicie o servidor.
