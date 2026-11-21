"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BookCard from "./BookCard";
import Pagination from "./Pagination";
import { EmptyMessage, ErrorMessage, Loading } from "./Feedback";
import { useApi } from "../lib/useApi";
import type { BookSearchResponse, SearchType } from "../lib/types";

const MIN_QUERY_LENGTH = 2;

// A busca fica guardada na URL (?q=...&type=...&page=...).
// Assim o botão "voltar" do navegador volta para os mesmos resultados.
export default function BookSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const q = (searchParams.get("q") ?? "").trim();
  const type: SearchType = searchParams.get("type") === "author" ? "author" : "title";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

  // Estado do formulário
  const [text, setText] = useState(q);
  const [searchType, setSearchType] = useState<SearchType>(type);
  const [formError, setFormError] = useState<string | null>(null);

  // Mantém o formulário igual à URL (por exemplo, ao voltar no navegador)
  useEffect(() => {
    setText(q);
    setSearchType(type);
  }, [q, type]);

  const url =
    q.length >= MIN_QUERY_LENGTH
      ? `/api/books?${new URLSearchParams({ q, type, page: String(page) })}`
      : null;

  const { data, loading, error, reload } = useApi<BookSearchResponse>(url);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = text.trim();

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setFormError(`Digite pelo menos ${MIN_QUERY_LENGTH} caracteres para buscar.`);
      return;
    }

    setFormError(null);
    router.push(`/?${new URLSearchParams({ q: trimmed, type: searchType, page: "1" })}`);
  }

  function goToPage(newPage: number) {
    router.push(`/?${new URLSearchParams({ q, type, page: String(newPage) })}`);
    window.scrollTo({ top: 0 });
  }

  return (
    <div>
      <form className="search-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor="search-text">Buscar livros</label>
          <input
            id="search-text"
            type="search"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={searchType === "title" ? "Ex.: Dom Casmurro" : "Ex.: Machado de Assis"}
            aria-invalid={formError ? true : undefined}
            aria-describedby={formError ? "search-error" : undefined}
            autoComplete="off"
          />
          {formError && (
            <p id="search-error" className="field-error" role="alert">
              {formError}
            </p>
          )}
        </div>

        <fieldset className="radio-group">
          <legend>Buscar por</legend>
          <label>
            <input
              type="radio"
              name="search-type"
              value="title"
              checked={searchType === "title"}
              onChange={() => setSearchType("title")}
            />
            Título
          </label>
          <label>
            <input
              type="radio"
              name="search-type"
              value="author"
              checked={searchType === "author"}
              onChange={() => setSearchType("author")}
            />
            Autor
          </label>
        </fieldset>

        <button type="submit" className="button" disabled={loading}>
          Buscar
        </button>
      </form>

      <section aria-label="Resultados da busca" className="results">
        {url === null && (
          <EmptyMessage title="Comece sua busca">
            Digite o título de um livro ou o nome de um autor para ver os resultados.
          </EmptyMessage>
        )}

        {loading && <Loading label="Buscando livros..." />}

        {error && <ErrorMessage message={error} onRetry={reload} />}

        {data && data.items.length === 0 && (
          <EmptyMessage title="Nenhum livro encontrado">
            Não encontramos resultados para “{q}”. Tente outro termo ou troque entre título e autor.
          </EmptyMessage>
        )}

        {data && data.items.length > 0 && (
          <>
            <p className="results-count" aria-live="polite">
              {data.total} {data.total === 1 ? "resultado" : "resultados"} para “{q}”
            </p>
            <ul className="book-grid">
              {data.items.map((book) => (
                <li key={book.work_id}>
                  <BookCard book={book} />
                </li>
              ))}
            </ul>
            <Pagination page={data.page} totalPages={data.total_pages} onChange={goToPage} />
          </>
        )}
      </section>
    </div>
  );
}
