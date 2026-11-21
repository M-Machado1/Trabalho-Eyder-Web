// PATCH /api/bookshelf/[id] - atualiza status e/ou anotação
// DELETE /api/bookshelf/[id] - remove um item da estante

import { NextRequest } from "next/server";
import { jsonError, readJsonBody } from "../../../../lib/http";
import { getDb, initDb } from "../../../../lib/db";
import type { ShelfItem, ShelfStatus } from "../../../../lib/types";
import { isShelfStatus } from "../../../../lib/types";

const EDITABLE_FIELDS = new Set(["status", "note"]);
const ID_REGEX = /^\d+$/;

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

function parseId(id: string): number | null {
  if (!ID_REGEX.test(id)) return null;
  const value = Number(id);
  return Number.isInteger(value) && value > 0 ? value : null;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseId(id);
  if (itemId === null) {
    return jsonError("O ID do item deve ser um número inteiro positivo.", 400);
  }

  initDb();
  const db = getDb();

  const existing = db.prepare(`SELECT id FROM bookshelf WHERE id = ?`).get(itemId);
  if (!existing) {
    return jsonError("Livro não encontrado na estante.", 404);
  }

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

  const keys = Object.keys(obj);
  for (const key of keys) {
    if (!EDITABLE_FIELDS.has(key)) {
      return jsonError(`O campo '${key}' não pode ser alterado.`, 400);
    }
  }
  const editableKeys = keys.filter((key) => EDITABLE_FIELDS.has(key));
  if (editableKeys.length === 0) {
    return jsonError("Informe ao menos um campo entre 'status' e 'note'.", 400);
  }

  const updates: string[] = [];
  const values: unknown[] = [];

  if (editableKeys.includes("status")) {
    const status = obj.status;
    if (typeof status !== "string" || !isShelfStatus(status)) {
      return jsonError("O campo 'status' deve ser want_to_read, reading ou read.", 400);
    }
    updates.push("status = ?");
    values.push(status);
  }

  if (editableKeys.includes("note")) {
    const note = obj.note;
    if (note !== null && note !== undefined && typeof note !== "string") {
      return jsonError("O campo 'note' deve ser uma string ou null.", 400);
    }
    let normalizedNote: string | null = null;
    if (typeof note === "string") {
      const trimmed = note.trim();
      if (trimmed === "") {
        normalizedNote = null;
      } else if (trimmed.length > 500) {
        return jsonError("A anotação pode ter no máximo 500 caracteres.", 400);
      } else {
        normalizedNote = trimmed;
      }
    }
    updates.push("note = ?");
    values.push(normalizedNote);
  }

  values.push(itemId);
  db.prepare(`UPDATE bookshelf SET ${updates.join(", ")} WHERE id = ?`).run(...values);

  const row = db
    .prepare(
      `SELECT id, work_id, title, cover_url, status, note, created_at
       FROM bookshelf WHERE id = ?`
    )
    .get(itemId) as Record<string, unknown>;

  return Response.json(shelfRowToItem(row));
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const itemId = parseId(id);
  if (itemId === null) {
    return jsonError("O ID do item deve ser um número inteiro positivo.", 400);
  }

  initDb();
  const db = getDb();

  const existing = db.prepare(`SELECT id FROM bookshelf WHERE id = ?`).get(itemId);
  if (!existing) {
    return jsonError("Livro não encontrado na estante.", 404);
  }

  db.prepare(`DELETE FROM bookshelf WHERE id = ?`).run(itemId);

  return new Response(null, { status: 204 });
}
