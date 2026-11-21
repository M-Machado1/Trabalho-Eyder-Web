// GET /api/bookshelf  -  lista os itens da estante (mais recentes primeiro)
// POST /api/bookshelf -  inclui um livro na estante

import { NextRequest } from "next/server";
import { jsonError, readJsonBody } from "../../../lib/http";
import { getDb, initDb } from "../../../lib/db";
import type { ShelfItem, ShelfStatus } from "../../../lib/types";
import { isShelfStatus } from "../../../lib/types";

function shelfRowToItem(row: Record<string, unknown>): ShelfItem {
  return {
    id: Number(row.id),
    work_id: String(row.work_id),
    title: String(row.title),
    cover_url: row.cover_url === null ? null : String(row.cover_url),
    status: String(row.status) as ShelfStatus,
    note: row.note === null ? null : String(row.note),
    created_at: String(row.created_at),
  };
}

export async function GET() {
  initDb();
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT id, work_id, title, cover_url, status, note, created_at
       FROM bookshelf
       ORDER BY created_at DESC, id DESC`
    )
    .all() as Record<string, unknown>[];

  return Response.json(rows.map(shelfRowToItem));
}

const WORK_ID_REGEX = /^OL\d+W$/;
const TITLE_MAX_LENGTH = 200;

export async function POST(request: NextRequest) {
  initDb();

  let body: unknown;
  try {
    body = await readJsonBody(request);
  } catch (err) {
    return jsonError((err as Error).message, 400);
  }
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return jsonError("Corpo da requisição inválido.", 400);
  }
  const obj = body as Record<string, unknown>;

  const work_id = obj.work_id;
  const title = obj.title;
  const cover_url = obj.cover_url;
  const status = obj.status === undefined ? "want_to_read" : obj.status;

  if (typeof work_id !== "string" || !WORK_ID_REGEX.test(work_id)) {
    return jsonError("O campo 'work_id' é obrigatório e deve ter o formato OL\d+W.", 400);
  }
  if (typeof title !== "string" || title.trim() === "") {
    return jsonError("O campo 'title' é obrigatório e não pode estar vazio.", 400);
  }
  const trimmedTitle = title.trim();
  if (trimmedTitle.length > TITLE_MAX_LENGTH) {
    return jsonError("O título é muito longo.", 400);
  }
  let normalizedCoverUrl: string | null = null;
  if (cover_url !== undefined && cover_url !== null) {
    if (typeof cover_url !== "string") {
      return jsonError("O campo 'cover_url' deve ser uma URL ou null.", 400);
    }
    let parsed: URL;
    try {
      parsed = new URL(cover_url);
    } catch {
      return jsonError("O campo 'cover_url' não é uma URL válida.", 400);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return jsonError("O campo 'cover_url' deve usar http:// ou https://.", 400);
    }
    normalizedCoverUrl = cover_url;
  }
  if (
    status !== "want_to_read" &&
    status !== "reading" &&
    status !== "read"
  ) {
    return jsonError("O campo 'status' deve ser want_to_read, reading ou read.", 400);
  }

  const db = getDb();

  const duplicate = db.prepare(`SELECT id FROM bookshelf WHERE work_id = ?`).get(work_id);
  if (duplicate) {
    return jsonError("Este livro já está na sua estante.", 409);
  }

  let result: { lastInsertRowid: number | bigint; changes: number };
  try {
    result = db
      .prepare(
        `INSERT INTO bookshelf (work_id, title, cover_url, status, note)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(work_id, trimmedTitle, normalizedCoverUrl, status, null);
  } catch (err) {
    const message = (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE"
      ? "Este livro já está na sua estante."
      : "Não foi possível incluir o livro na estante.";
    return jsonError(message, (err as { code?: string }).code === "SQLITE_CONSTRAINT_UNIQUE" ? 409 : 500);
  }

  const row = db
    .prepare(
      `SELECT id, work_id, title, cover_url, status, note, created_at
       FROM bookshelf WHERE id = ?`
    )
    .get(Number(result.lastInsertRowid)) as Record<string, unknown>;

  return Response.json(shelfRowToItem(row), { status: 201 });
}
