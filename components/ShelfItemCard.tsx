"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import BookCover from "./BookCover";
import { ApiError, apiRequest } from "../lib/api";
import { formatDate } from "../lib/format";
import { STATUS_LABELS, STATUS_OPTIONS, isShelfStatus } from "../lib/types";
import type { ShelfItem } from "../lib/types";

const NOTE_MAX_LENGTH = 500;

interface ShelfItemCardProps {
  item: ShelfItem;
  onUpdated: (item: ShelfItem) => void;
  onRemoved: (id: number) => void;
}

interface Message {
  kind: "success" | "error";
  text: string;
}

type Action = "status" | "note" | "remove";

// Um livro da estante: troca de status, edição da anotação e remoção
export default function ShelfItemCard({ item, onUpdated, onRemoved }: ShelfItemCardProps) {
  const [note, setNote] = useState(item.note ?? "");
  const [busy, setBusy] = useState<Action | null>(null);
  const [message, setMessage] = useState<Message | null>(null);

  const noteChanged = note !== (item.note ?? "");
  const added = formatDate(item.created_at);

  function showError(err: unknown) {
    const text = err instanceof ApiError ? err.message : "Algo deu errado. Tente novamente.";
    setMessage({ kind: "error", text });
  }

  async function handleStatusChange(event: ChangeEvent<HTMLSelectElement>) {
    const status = event.target.value;
    if (!isShelfStatus(status)) return;

    setBusy("status");
    setMessage(null);
    try {
      const updated = await apiRequest<ShelfItem>(`/api/bookshelf/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      onUpdated(updated);
      setMessage({ kind: "success", text: "Status atualizado." });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleSaveNote() {
    if (note.length > NOTE_MAX_LENGTH) {
      setMessage({ kind: "error", text: `A anotação pode ter no máximo ${NOTE_MAX_LENGTH} caracteres.` });
      return;
    }

    setBusy("note");
    setMessage(null);
    try {
      const trimmed = note.trim();
      const updated = await apiRequest<ShelfItem>(`/api/bookshelf/${item.id}`, {
        method: "PATCH",
        body: JSON.stringify({ note: trimmed === "" ? null : trimmed }),
      });
      onUpdated(updated);
      setNote(updated.note ?? "");
      setMessage({ kind: "success", text: "Anotação salva." });
    } catch (err) {
      showError(err);
    } finally {
      setBusy(null);
    }
  }

  async function handleRemove() {
    if (!window.confirm(`Remover “${item.title}” da estante?`)) return;

    setBusy("remove");
    setMessage(null);
    try {
      await apiRequest<void>(`/api/bookshelf/${item.id}`, { method: "DELETE" });
      onRemoved(item.id);
    } catch (err) {
      showError(err);
      setBusy(null);
    }
  }

  const statusId = `status-${item.id}`;
  const noteId = `note-${item.id}`;

  return (
    <article className="shelf-item">
      <Link href={`/books/${encodeURIComponent(item.work_id)}`} className="shelf-item-cover">
        <BookCover coverUrl={item.cover_url} title={item.title} decorative />
        <span className="sr-only">Ver detalhes de {item.title}</span>
      </Link>

      <div className="shelf-item-body">
        <h2 className="shelf-item-title">
          <Link href={`/books/${encodeURIComponent(item.work_id)}`}>{item.title}</Link>
        </h2>
        {added && <p className="muted">Adicionado em {added}</p>}

        <div className="field">
          <label htmlFor={statusId}>Status</label>
          <select
            id={statusId}
            value={item.status}
            onChange={handleStatusChange}
            disabled={busy !== null}
          >
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor={noteId}>Anotação</label>
          <textarea
            id={noteId}
            rows={3}
            maxLength={NOTE_MAX_LENGTH}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            aria-describedby={`${noteId}-count`}
            disabled={busy !== null}
          />
          <p id={`${noteId}-count`} className="muted counter">
            {note.length}/{NOTE_MAX_LENGTH} caracteres
          </p>
        </div>

        <div className="button-row">
          <button
            type="button"
            className="button"
            onClick={handleSaveNote}
            disabled={busy !== null || !noteChanged}
          >
            {busy === "note" ? "Salvando..." : "Salvar anotação"}
          </button>
          <button
            type="button"
            className="button button-danger"
            onClick={handleRemove}
            disabled={busy !== null}
          >
            {busy === "remove" ? "Removendo..." : "Remover"}
          </button>
        </div>

        <p
          className={message ? `shelf-message shelf-message-${message.kind}` : "sr-only"}
          role={message?.kind === "error" ? "alert" : undefined}
          aria-live={message?.kind === "error" ? undefined : "polite"}
        >
          {message?.text}
        </p>
      </div>
    </article>
  );
}
