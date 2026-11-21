interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav className="pagination" aria-label="Paginação dos resultados">
      <button
        type="button"
        className="button button-secondary"
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
      >
        Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button
        type="button"
        className="button button-secondary"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages}
      >
        Próxima
      </button>
    </nav>
  );
}
