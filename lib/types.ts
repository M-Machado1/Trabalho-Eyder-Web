// Tipos usados pelo frontend. Eles descrevem o JSON que o backend (/api/...)
// devolve. Os nomes dos campos seguem o padrão do enunciado (snake_case).

export type ShelfStatus = "want_to_read" | "reading" | "read";
export type SearchType = "title" | "author";

export const STATUS_OPTIONS: ShelfStatus[] = ["want_to_read", "reading", "read"];

export const STATUS_LABELS: Record<ShelfStatus, string> = {
  want_to_read: "Quero ler",
  reading: "Lendo",
  read: "Lido",
};

export function isShelfStatus(value: string): value is ShelfStatus {
  return (STATUS_OPTIONS as string[]).includes(value);
}

// Livro resumido (resultado da busca e lista de obras do autor)
export interface BookSummary {
  work_id: string;
  title: string;
  authors: string[]; // lista vazia quando o autor é desconhecido
  first_publish_year: number | null;
  cover_url: string | null; // null quando o livro não tem capa
}

// GET /api/books?q=...&type=title|author&page=1
export interface BookSearchResponse {
  items: BookSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface AuthorRef {
  author_id: string;
  name: string;
}

// GET /api/books/[workId]
export interface BookDetail {
  work_id: string;
  title: string;
  authors: AuthorRef[];
  first_publish_year: number | null;
  description: string; // já normalizada pelo backend ("" quando não existe)
  cover_url: string | null;
}

// GET /api/authors/[authorId]
export interface AuthorDetail {
  author_id: string;
  name: string;
  birth_date: string | null;
  death_date: string | null;
  bio: string; // "" quando não existe
  photo_url: string | null;
  works: BookSummary[];
}

// GET /api/bookshelf (lista) e POST/PATCH (um item)
export interface ShelfItem {
  id: number;
  work_id: string;
  title: string;
  cover_url: string | null;
  status: ShelfStatus;
  note: string | null;
  created_at: string;
}
