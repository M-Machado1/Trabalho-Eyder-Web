"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import BookCard from "../../../components/BookCard";
import { EmptyMessage, ErrorMessage, Loading } from "../../../components/Feedback";
import { useApi } from "../../../lib/useApi";
import type { AuthorDetail } from "../../../lib/types";

// Página do autor (rota dinâmica /authors/[authorId])
export default function AuthorPage() {
  const params = useParams<{ authorId: string }>();
  const authorId = params.authorId;

  const { data: author, loading, error, reload } = useApi<AuthorDetail>(
    `/api/authors/${encodeURIComponent(authorId)}`
  );
  const [photoFailed, setPhotoFailed] = useState(false);

  useEffect(() => {
    if (author) document.title = `${author.name} | Catálogo de Livros`;
  }, [author]);

  return (
    <>
      <p>
        <Link href="/">Voltar para a busca</Link>
      </p>

      {loading && <Loading label="Carregando dados do autor..." />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      {author && (
        <>
          <section className="detail" aria-labelledby="author-name">
            <div className="detail-cover">
              {author.photo_url && !photoFailed ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="cover"
                  src={author.photo_url}
                  alt={`Foto de ${author.name}`}
                  onError={() => setPhotoFailed(true)}
                />
              ) : (
                <div className="cover cover-empty" role="img" aria-label={`Autor sem foto: ${author.name}`}>
                  <span>{author.name}</span>
                </div>
              )}
            </div>

            <div>
              <h1 id="author-name">{author.name}</h1>

              <dl className="info-list">
                {author.birth_date && (
                  <div>
                    <dt>Nascimento</dt>
                    <dd>{author.birth_date}</dd>
                  </div>
                )}
                {author.death_date && (
                  <div>
                    <dt>Morte</dt>
                    <dd>{author.death_date}</dd>
                  </div>
                )}
              </dl>

              <h2>Biografia</h2>
              <p className="description">
                {author.bio.trim() !== "" ? author.bio : "Este autor não tem biografia disponível."}
              </p>
            </div>
          </section>

          <section aria-labelledby="author-works">
            <h2 id="author-works">Obras ({author.works.length})</h2>
            {author.works.length === 0 ? (
              <EmptyMessage title="Nenhuma obra encontrada">
                A Open Library não retornou obras para este autor.
              </EmptyMessage>
            ) : (
              <ul className="book-grid">
                {author.works.map((book) => (
                  <li key={book.work_id}>
                    <BookCard book={book} showAuthors={false} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </>
  );
}
