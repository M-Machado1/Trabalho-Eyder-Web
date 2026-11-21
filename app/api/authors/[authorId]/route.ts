// GET /api/authors/[authorId] - dados do autor e suas obras na Open Library

import { NextRequest } from "next/server";
import { jsonError } from "../../../../lib/http";
import { openLibraryErrorResponse, getAuthor } from "../../../../lib/openlibrary";

const AUTHOR_ID_REGEX = /^OL\d+A$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ authorId: string }> }
) {
  const { authorId } = await params;

  if (!AUTHOR_ID_REGEX.test(authorId)) {
    return jsonError("O ID do autor é inválido (esperado formato OL\d+A).", 400);
  }

  let author;
  try {
    author = await getAuthor(authorId);
  } catch (err) {
    return openLibraryErrorResponse(err);
  }

  return Response.json(author);
}
