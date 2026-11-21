"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookCover from "../../../components/BookCover";
import AddToShelfButton from "../../../components/AddToShelfButton";
import { ErrorMessage, Loading } from "../../../components/Feedback";
import { formatYear } from "../../../lib/format";
import { useApi } from "../../../lib/useApi";
import type { BookDetail } from "../../../lib/types";

// Detalhe da obra (rota dinâmica /books/[workId])
export default function BookDetailPage() {
  const params = useParams<{ workId: string }>();
  const workId = params.workId;

  const { data: book, loading, error, reload } = useApi<BookDetail>(
    `/api/books/${encodeURIComponent(workId)}`
  );

  // Atualiza o título da aba com o nome do livro
  useEffect(() => {
    if (book) document.title = `${book.title} | Catálogo de Livros`;
  }, [book]);

  return (
    <>
      <p>
        <Link href="/">Voltar para a busca</Link>
      </p>

      {loading && <Loading label="Carregando detalhes do livro..." />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {book && (
        <article className="detail">
          <div className="detail-cover">
            <BookCover coverUrl={book.cover_url} title={book.title} />
          </div>

          <div>
            <h1>{book.title}</h1>

            <dl className="info-list">
              <div>
                <dt>Autores</dt>
                <dd>
                  {book.authors.length === 0 ? (
                    "Autor desconhecido"
                  ) : (
                    <ul className="inline-list">
                      {book.authors.map((author) => (
                        <li key={author.author_id}>
                          <Link href={`/authors/${encodeURIComponent(author.author_id)}`}>
                            {author.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </dd>
              </div>
              <div>
                <dt>Primeira publicação</dt>
                <dd>{formatYear(book.first_publish_year)}</dd>
              </div>
            </dl>

            <h2>Descrição</h2>
            <p className="description">
              {book.description.trim() !== "" ? book.description : "Este livro não tem descrição disponível."}
            </p>

            <AddToShelfButton book={book} />
          </div>
        </article>
      )}
    </>
  );
}
