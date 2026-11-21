"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiRequest } from "./api";

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

// Hook que faz um GET no backend e controla os estados de carregamento e erro.
// Se a url for null, nenhuma requisição é feita.
export function useApi<T>(url: string | null) {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    loading: url !== null,
    error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (url === null) {
      setState({ data: null, loading: false, error: null });
      return;
    }

    const controller = new AbortController();
    setState({ data: null, loading: true, error: null });

    apiRequest<T>(url, { signal: controller.signal })
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((err: unknown) => {
        if (err instanceof DOMException && err.name === "AbortError") return;
        const message = err instanceof ApiError ? err.message : "Erro inesperado.";
        setState({ data: null, loading: false, error: message });
      });

    // Cancela a requisição antiga se a url mudar ou a página for fechada
    return () => controller.abort();
  }, [url, attempt]);

  // Tentar de novo (botão "Tentar novamente")
  const reload = useCallback(() => setAttempt((n) => n + 1), []);

  // Altera os dados já carregados sem buscar de novo (usado na estante)
  const mutate = useCallback((updater: (current: T | null) => T | null) => {
    setState((prev) => ({ ...prev, data: updater(prev.data) }));
  }, []);

  return { ...state, reload, mutate };
}
