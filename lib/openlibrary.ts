// Chamadas à Open Library (https://openlibrary.org): busca, obra, autor, capa e foto.
// Toda requisição envia o cabeçalho User-Agent obrigatório. Os dados da Open Library
// nunca são copiados para o banco; esse arquivo apenas busca e normaliza respostas ao vivo.

import type { AuthorDetail, AuthorRef, BookDetail, BookSummary } from "./types";
import { jsonError } from "./http";

const USER_AGENT = "CatalogoLivros/1.0 (murilomachado@aluno.uespi.br)";
const BASE_URL = "https://openlibrary.org";
const PAGE_SIZE = 20;
const TIMEOUT_MS = 10000;

export class OpenLibraryError extends Error {
  kind: "not_found" | "upstream";

  constructor(message: string, kind: "not_found" | "upstream") {
    super(message);
    this.name = "OpenLibraryError";
    this.kind = kind;
  }
}

async function fetchJson(path: string, params?: Record<string, string>): Promise<unknown> {
  const url = new URL(BASE_URL + path);
  if (params) {
    url.search = new URLSearchParams(params).toString();
  }

  try {
    const response = await fetch(url.toString(), {
      cache: "no-store",
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (response.status === 404) {
      throw new OpenLibraryError(`Não encontrado na Open Library: ${url.pathname}`, "not_found");
    }
    if (!response.ok) {
      throw new OpenLibraryError(`Falha na Open Library (HTTP ${response.status})`, "upstream");
    }

    return await response.json();
  } catch (err) {
    if (err instanceof OpenLibraryError) throw err;
    throw new OpenLibraryError(
      `Falha de comunica\u00e7\u00e3o com a Open Library: ${(err as Error).message}`,
      "upstream"
    );
  }
}

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function firstPositiveId(value: unknown): number | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "number" && Number.isFinite(item) && item > 0) {
        return item;
      }
    }
  }
  return null;
}

// description/bio podem vir como string, objeto { type, value } ou ausente -> sempre string.
export function normalizeDescription(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value !== null && typeof value === "object" && "value" in value) {
    const objectValue = (value as { value: unknown }).value;
    if (typeof objectValue === "string") return objectValue.trim();
  }
  return "";
}

export function coverUrl(coverId: number | null): string | null {
  return coverId === null ? null : `https://covers.openlibrary.org/b/id/${coverId}-M.jpg`;
}

export function authorPhotoUrl(photoId: number | null): string | null {
  return photoId === null ? null : `https://covers.openlibrary.org/a/id/${photoId}-M.jpg`;
}

function extractWorkId(key: unknown): string {
  if (typeof key !== "string") return "";
  const match = key.match(/\/works\/(OL\d+W)$/);
  return match ? match[1] : "";
}

function extractAuthorId(key: unknown): string | null {
  if (typeof key !== "string") return null;
  const match = key.match(/\/authors\/(OL\d+A)$/);
  return match ? match[1] : null;
}

function extractYearFromDate(value: unknown): number | null {
  const text = asString(value);
  if (!text) return null;
  const match = text.match(/\d{4}/);
  return match ? Number(match[0]) : null;
}

interface RawSearchDoc {
  key?: unknown;
  title?: unknown;
  author_name?: unknown;
  first_publish_year?: unknown;
  cover_i?: unknown;
}

function docToSummary(doc: RawSearchDoc): BookSummary | null {
  const work_id = extractWorkId(doc.key);
  if (!work_id) return null;
  const title = asString(doc.title).trim() || "T\u00edtulo n\u00e3o informado";
  const rawAuthors = doc.author_name;
  const authors: string[] = Array.isArray(rawAuthors)
    ? rawAuthors.filter((item): item is string => typeof item === "string")
    : [];
  const first_publish_year = asNumber(doc.first_publish_year);
  const cover_url = coverUrl(firstPositiveId(doc.cover_i));
  return { work_id, title, authors, first_publish_year, cover_url };
}

export interface SearchResult {
  items: BookSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export async function searchBooks(
  q: string,
  type: "title" | "author",
  page: number
): Promise<SearchResult> {
  const raw = await fetchJson("/search.json", {
    [type === "title" ? "title" : "author"]: q,
    page: String(page),
    limit: String(PAGE_SIZE),
    fields: "key,title,author_name,first_publish_year,cover_i",
  });

  const total = asNumber(
    raw !== null && typeof raw === "object" && "numFound" in raw
      ? (raw as { numFound: unknown }).numFound
      : undefined
  ) ?? 0;
  const rawDocs =
    raw !== null && typeof raw === "object" && "docs" in raw
      ? (raw as { docs: unknown }).docs
      : undefined;
  const docs: RawSearchDoc[] = Array.isArray(rawDocs) ? rawDocs : [];

  return {
    items: docs.map(docToSummary).filter((item): item is BookSummary => item !== null),
    total,
    page,
    page_size: PAGE_SIZE,
    total_pages: total > 0 ? Math.ceil(total / PAGE_SIZE) : 0,
  };
}

interface RawWork {
  key?: unknown;
  title?: unknown;
  description?: unknown;
  covers?: unknown;
  authors?: unknown;
  first_publish_date?: unknown;
}

function workAuthorsKeys(raw: RawWork): string[] {
  const ids: string[] = [];
  const rawAuthors = raw.authors;
  if (!Array.isArray(rawAuthors)) return ids;
  for (const item of rawAuthors) {
    if (item === null || typeof item !== "object") continue;
    const author = (item as { author: unknown }).author;
    if (author === null || typeof author !== "object") continue;
    const key = (author as { key: unknown }).key;
    const id = extractAuthorId(key);
    if (id) ids.push(id);
  }
  return ids;
}

export async function getWork(workId: string): Promise<BookDetail> {
  const raw = (await fetchJson(`/works/${workId}.json`)) as RawWork;

  const title = asString(raw.title).trim() || "T\u00edtulo n\u00e3o informado";
  const description = normalizeDescription(raw.description);
  const cover_url = coverUrl(firstPositiveId(raw.covers));
  const first_publish_year = extractYearFromDate(raw.first_publish_date);

  // Nomes dos autores buscados em paralelo; uma falha de um autor não derruba a p\u00e1gina.
  const authors: AuthorRef[] = [];
  await Promise.all(
    workAuthorsKeys(raw).map(async (authorId) => {
      try {
        const authorRaw = (await fetchJson(
          `/authors/${authorId}.json`
        )) as { name?: unknown };
        const name = asString(authorRaw.name).trim();
        if (name) authors.push({ author_id: authorId, name });
      } catch {
        // omite este autor e segue
      }
    })
  );

  return {
    work_id: workId,
    title,
    authors,
    first_publish_year,
    description,
    cover_url,
  };
}

interface RawAuthor {
  name?: unknown;
  birth_date?: unknown;
  death_date?: unknown;
  bio?: unknown;
  photos?: unknown;
}

interface RawWorkEntry {
  key?: unknown;
  title?: unknown;
  covers?: unknown;
  first_publish_date?: unknown;
}

function workEntryToSummary(entry: RawWorkEntry): BookSummary {
  return {
    work_id: extractWorkId(entry.key),
    title: asString(entry.title).trim() || "T\u00edtulo n\u00e3o informado",
    authors: [],
    first_publish_year: extractYearFromDate(entry.first_publish_date),
    cover_url: coverUrl(firstPositiveId(entry.covers)),
  };
}

export async function getAuthor(authorId: string): Promise<AuthorDetail> {
  const raw = (await fetchJson(`/authors/${authorId}.json`)) as RawAuthor;

  const name = asString(raw.name).trim() || "Autor n\u00e3o informado";
  const birth_date = asString(raw.birth_date) || null;
  const death_date = asString(raw.death_date) || null;
  const bio = normalizeDescription(raw.bio);
  const photo_url = authorPhotoUrl(firstPositiveId(raw.photos));

  const worksRaw = (await fetchJson(
    `/authors/${authorId}/works.json`,
    { limit: "24" }
  )) as { entries?: unknown };

  const works: BookSummary[] = [];
  const rawEntries =
    worksRaw !== null && typeof worksRaw === "object" && "entries" in worksRaw
      ? (worksRaw as { entries: unknown }).entries
      : undefined;
  if (Array.isArray(rawEntries)) {
    for (const entry of rawEntries) {
      if (entry !== null && typeof entry === "object") {
        works.push(workEntryToSummary(entry as RawWorkEntry));
      }
    }
  }

  return {
    author_id: authorId,
    name,
    birth_date,
    death_date,
    bio,
    photo_url,
    works,
  };
}

export function openLibraryErrorResponse(err: unknown): Response {
  if (err instanceof OpenLibraryError) {
    return jsonError(err.message, err.kind === "not_found" ? 404 : 502);
  }
  return jsonError("Erro inesperado ao acessar a Open Library.", 500);
}
