// Função única para falar com o backend. Ela:
//  - envia a requisição com fetch;
//  - converte erros de rede e erros HTTP em ApiError com mensagem em português;
//  - devolve undefined quando a resposta é 204 (sem conteúdo).

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

function isErrorBody(value: unknown): value is { error: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    "error" in value &&
    typeof (value as { error: unknown }).error === "string"
  );
}

export async function apiRequest<T>(url: string, options: RequestInit = {}): Promise<T> {
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    // Requisição cancelada de propósito: quem chamou decide o que fazer
    if (err instanceof DOMException && err.name === "AbortError") {
      throw err;
    }
    throw new ApiError("Não foi possível conectar ao servidor. Verifique sua conexão.", 0);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = isErrorBody(body)
      ? body.error
      : "Ocorreu um erro inesperado. Tente novamente.";
    throw new ApiError(message, response.status);
  }

  return body as T;
}
