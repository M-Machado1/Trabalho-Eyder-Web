"use client";

import { useState } from "react";
import type { ChangeEvent } from "react";
import Link from "next/link";
import ShelfItemCard from "../../components/ShelfItemCard";
import { EmptyMessage, ErrorMessage, Loading } from "../../components/Feedback";
import { useApi } from "../../lib/useApi";
import { STATUS_LABELS, STATUS_OPTIONS, isShelfStatus } from "../../lib/types";
import type { ShelfItem, ShelfStatus } from "../../lib/types";

type Filter = "all" | ShelfStatus;

// Estante pessoal: lista, troca de status, edição de anotação e remoção
export default function BookshelfPage() {
  const { data, loading, error, reload, mutate } = useApi<ShelfItem[]>("/api/bookshelf");
  const [filter, setFilter] = useState<Filter>("all");
  const [notice, setNotice] = useState("");

  const items = data ?? [];
  const visible = filter === "all" ? items : items.filter((item) => item.status === filter);

  function handleFilterChange(event: ChangeEvent<HTMLSelectElement>) {
    const value = event.target.value;
    setFilter(isShelfStatus(value) ? value : "all");
  }

  function handleUpdated(updated: ShelfItem) {
    mutate((current) => (current ? current.map((i) => (i.id === updated.id ? updated : i)) : current));
  }

  function handleRemoved(id: number) {
    mutate((current) => (current ? current.filter((i) => i.id !== id) : current));
    setNotice("Livro removido da estante.");
  }

  return (
    <>
      <h1>Minha estante</h1>

      {loading && <Loading label="Carregando sua estante..." />}
      {error && <ErrorMessage message={error} onRetry={reload} />}

      <p className="sr-only" role="status">
        {notice}
      </p>

      {data && items.length === 0 && (
        <EmptyMessage title="Sua estante está vazia">
          <Link href="/">Busque um livro</Link> e use “Adicionar à estante” para começar.
        </EmptyMessage>
      )}

      {data && items.length > 0 && (
        <>
          <div className="shelf-toolbar">
            <div className="field">
              <label htmlFor="filter-status">Filtrar por status</label>
              <select id="filter-status" value={filter} onChange={handleFilterChange}>
                <option value="all">Todos</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
            <p className="muted">
              {visible.length} de {items.length} {items.length === 1 ? "livro" : "livros"}
            </p>
          </div>

          {visible.length === 0 ? (
            <EmptyMessage title="Nenhum livro com este status">
              Troque o filtro para ver os outros livros da estante.
            </EmptyMessage>
          ) : (
            <ul className="shelf-list">
              {visible.map((item) => (
                <li key={item.id}>
                  <ShelfItemCard item={item} onUpdated={handleUpdated} onRemoved={handleRemoved} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </>
  );
}
