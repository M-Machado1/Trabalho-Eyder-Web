# Trabalho-Eyder-Web — Catálogo de Livros

## Integrantes

- Integrante 1: Murilo Linhares Pereira Val Machado
- Integrante 2: Bruno Vinicius dos Reis Souza
- E-mail de contato: murilomachado@aluno.uespi.br

## Projeto

**Nome da aplicação:** Catálogo de Livros

Aplicação de busca de livros com estante pessoal de leitura. Permite buscar livros por título ou autor, ver detalhes de uma obra e de seu autor, e manter uma estante própria com status de leitura e anotações.

Principais funcionalidades:

- Busca paginada de livros por título ou autor (fonte: Open Library)
- Detalhe da obra: descrição, autores, ano da primeira publicação e capa
- Página do autor: biografia, datas de nascimento/morte, foto e lista de obras
- Estante pessoal: adicionar livro, alterar status (quero ler / lendo / lido), editar ou limpar anotação e remover livro

## API externa

Os dados de livros e autores vêm da **Open Library** (`https://openlibrary.org`), consultados em tempo de execução somente pelo backend (Route Handlers em `app/api/`). Nunca são copiados para o banco local.

Toda requisição à Open Library envia o cabeçalho:

```
User-Agent: CatalogoLivros/1.0 (murilomachado@aluno.uespi.br)
```

## Endpoints do backend

Todas as respostas são JSON. Erros seguem o formato `{ "error": "mensagem em português" }`.

| Método | Endpoint | Finalidade | Parâmetros de consulta / corpo |
|---|---|---|---|
| GET | `/api/books` | Busca paginada de livros | `q` (obrigatório, ≥ 2 caracteres), `type` (`title` \| `author`, padrão `title`), `page` (inteiro ≥ 1, padrão 1). `page_size` fixo em 20. |
| GET | `/api/books/[workId]` | Detalhe de uma obra | `workId` no formato `OL\d+W` (ex.: `OL27482W`) |
| GET | `/api/authors/[authorId]` | Dados do autor e suas obras | `authorId` no formato `OL\d+A` (ex.: `OL93286A`) |
| GET | `/api/bookshelf` | Listar itens da estante (mais recentes primeiro) | — |
| POST | `/api/bookshelf` | Incluir livro na estante | Corpo: `{ work_id, title, cover_url, status? }` |
| PATCH | `/api/bookshelf/[id]` | Atualizar status e/ou anotação | Corpo com apenas `status` e/ou `note` |
| DELETE | `/api/bookshelf/[id]` | Remover item da estante | — |

Códigos de status:

| Situação | Código |
|---|---|
| Consulta com sucesso | 200 |
| Registro criado | 201 |
| Registro removido | 204 |
| Parâmetro ausente ou inválido | 400 |
| Recurso inexistente | 404 |
| Registro duplicado ou limite excedido | 409 |
| Falha na comunicação com a API externa | 502 |
| Erro interno | 500 |

## Banco de dados

- Localização: `data/app.db` (criado automaticamente na primeira execução; não vai para o git)
- SQLite via `better-sqlite3`, journal mode padrão `DELETE` (sem WAL)
- Tabela `bookshelf`:

| Campo | Tipo | Constraint | Editável? |
|---|---|---|---|
| id | INTEGER | PRIMARY KEY AUTOINCREMENT | Não |
| work_id | TEXT | NOT NULL, UNIQUE | Não |
| title | TEXT | NOT NULL | Não |
| cover_url | TEXT | (null quando não há capa) | Não |
| status | TEXT | NOT NULL DEFAULT 'want_to_read', CHECK ('want_to_read','reading','read') | Sim |
| note | TEXT | CHECK (note IS NULL OR length(note) <= 500) | Sim |
| created_at | TEXT | NOT NULL DEFAULT (datetime('now','localtime')) | Não |

Somente `status` e `note` são editáveis (via PATCH). `work_id` é `UNIQUE`, então tentar adicionar um livro já presente retorna 409.

Registros iniciais (seed, inseridos apenas quando o banco é criado):

| work_id | Título | Status | Anotação |
|---|---|---|---|
| OL27482W | The Hobbit | want_to_read | Pretendo ler em breve. |
| OL66554W | Pride and Prejudice | reading | Lendo agora, gostando muito. |
| OL1168083W | Nineteen Eighty-Four | read | — |
| OL450063W | Frankenstein; or, The Modern Prometheus | want_to_read | — |
| OL1003040W | Dom Casmurro | read | Clássico de Machado de Assis. |

Apagar o arquivo `data/app.db` e reiniciar a aplicação restaura esses registros iniciais.

## Tecnologias

- Next.js 16 (App Router, Route Handlers), React 19, TypeScript (modo estrito)
- CSS puro (`app/globals.css`, sem Tailwind)
- Banco: SQLite via `better-sqlite3` (SQL puro, sem ORM)
- HTTP: `fetch` nativo
- Versão do Node.js usada: `v24.21.0`

## Execução

O avaliador roda apenas:

```
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3000`.

Não há passos extras. O banco `data/app.db` é criado automaticamente. Para restaurar o estado inicial, apague `data/app.db` e reinicie o servidor.

## Observações sobre o frontend (reportadas, não corrigidas)

- O rodapé em `app/layout.tsx` credita "murilo livros" em vez da Open Library.
- O botão "Adicionar à estante" só descobre que o livro já está na estante ao receber o 409 (aparece como "Adicionar" até o clique).
- O `package.json` mantém resíduos de `npm init` (`main`, `description` vazia, script `test`).
