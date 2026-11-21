import type { ReactNode } from "react";

// Mensagens de estado reutilizadas em todas as páginas:
// carregando, erro e ausência de resultados.

export function Loading({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="feedback" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
  return (
    <div className="feedback feedback-error" role="alert">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="button button-secondary" onClick={onRetry}>
          Tentar novamente
        </button>
      )}
    </div>
  );
}

interface EmptyMessageProps {
  title: string;
  children?: ReactNode;
}

export function EmptyMessage({ title, children }: EmptyMessageProps) {
  return (
    <div className="feedback feedback-empty">
      <div>
        <p className="feedback-title">{title}</p>
        {children && <div className="feedback-text">{children}</div>}
      </div>
    </div>
  );
}
