"use client";

import { useState } from "react";
import Link from "next/link";
import { ApiError, apiRequest } from "../lib/api";
import type { BookSummary, ShelfItem } from "../lib/types";

interface AddToShelfButtonProps {
  book: Pick<BookSummary, "work_id" | "title" | "cover_url">;
}

interface Feedback {
  kind: "success" | "info" | "error";
  text: string;
}

// Botão que inclui o livro na estante (POST /api/bookshelf)
export default function AddToShelfButton({ book }: AddToShelfButtonProps) {
  const [saving, setSaving] = useState(false);
  const [added, setAdded] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  async function handleAdd() {
    setSaving(true);
    setFeedback(null);

    try {
      await apiRequest<ShelfItem>("/api/bookshelf", {
        method: "POST",
        body: JSON.stringify({
          work_id: book.work_id,
          title: book.title,
          cover_url: book.cover_url,
          status: "want_to_read",
        }),
      });
      setAdded(true);
      setFeedback({ kind: "success", text: "Livro adicionado à estante." });
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        // 409 = livro duplicado
        setAdded(true);
        setFeedback({ kind: "info", text: "Este livro já está na sua estante." });
      } else {
        const text = err instanceof ApiError ? err.message : "Não foi possível adicionar o livro.";
        setFeedback({ kind: "error", text });
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="shelf-action">
      <button
        type="button"
        className="button"
        onClick={handleAdd}
        disabled={saving || added}
      >
        {saving ? "Adicionando..." : added ? "Na estante" : "Adicionar à estante"}
      </button>
      <p
        className={feedback ? `shelf-message shelf-message-${feedback.kind}` : "sr-only"}
        aria-live="polite"
      >
        {feedback?.text}{" "}
        {feedback && feedback.kind !== "error" && <Link href="/bookshelf">Ver estante</Link>}
      </p>
    </div>
  );
}
