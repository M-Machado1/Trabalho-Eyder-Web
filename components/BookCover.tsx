"use client";

import { useState } from "react";

interface BookCoverProps {
  coverUrl: string | null;
  title: string;
  // true quando a capa está dentro de um link que já tem o título como texto
  decorative?: boolean;
}

// Mostra a capa do livro. Se não houver capa (ou a imagem falhar ao carregar),
// mostra um quadro com o título do livro.
export default function BookCover({ coverUrl, title, decorative = false }: BookCoverProps) {
  const [failed, setFailed] = useState(false);

  if (!coverUrl || failed) {
    return (
      <div
        className="cover cover-empty"
        role={decorative ? undefined : "img"}
        aria-label={decorative ? undefined : `Livro sem capa: ${title}`}
        aria-hidden={decorative ? true : undefined}
      >
        <span>{title}</span>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className="cover"
      src={coverUrl}
      alt={decorative ? "" : `Capa do livro ${title}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
