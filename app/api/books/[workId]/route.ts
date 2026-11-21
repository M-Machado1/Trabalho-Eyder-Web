// GET /api/books/[workId] - detalhe de uma obra na Open Library

import { NextRequest } from "next/server";
import { jsonError } from "../../../../lib/http";
import { openLibraryErrorResponse, getWork } from "../../../../lib/openlibrary";

const WORK_ID_REGEX = /^OL\d+W$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ workId: string }> }
) {
  const { workId } = await params;

  if (!WORK_ID_REGEX.test(workId)) {
    return jsonError("O ID da obra é inválido (esperado formato OL\d+W).", 400);
  }

  let book;
  try {
    book = await getWork(workId);
  } catch (err) {
    return openLibraryErrorResponse(err);
  }

  return Response.json(book);
}
