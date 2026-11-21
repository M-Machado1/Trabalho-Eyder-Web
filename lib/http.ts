// Helpers de resposta HTTP: erros padronizados em JSON e leitura de corpo de requisição.

export function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new Error("Corpo da requisição não é um JSON válido.");
  }
}
