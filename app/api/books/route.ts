// GET /api/books?q=...&type=title|author&page=1  -  busca paginada na Open Library

import { NextRequest } from "next/server";
import { jsonError } from "../../../lib/http";
import { OpenLibraryError, searchBooks } from "../../../lib/openlibrary";

const MIN_QUERY_LENGTH = 2;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const rawType = searchParams.get("type") ?? "title";
  const pageParam = searchParams.get("page") ?? "1";

  if (q.length < MIN_QUERY_LENGTH) {
    return jsonError("Informe pelo menos 2 caracteres para buscar.", 400);
  }

  let type: "title" | "author";
  if (rawType === "title") {
    type = "title";
  } else if (rawType === "author") {
    type = "author";
  } else {
    return jsonError("O parâmetro 'type' deve ser 'title' ou 'author'.", 400);
  }

  if (!/^\d+$/.test(pageParam)) {
    return jsonError("O parâmetro 'page' deve ser um número inteiro.", 400);
  }
  const page = Number(pageParam);
  if (page < 1) {
    return jsonError("O parâmetro 'page' deve ser maior ou igual a 1.", 400);
  }

  let result;
  try {
    result = await searchBooks(q, type, page);
  } catch (err) {
    if (err instanceof OpenLibraryError) {
      return jsonError(err.message, err.kind === "not_found" ? 404 : 502);
    }
    return jsonError("Erro ao buscar livros na Open Library.", 500);
  }

  return Response.json(result);
}
