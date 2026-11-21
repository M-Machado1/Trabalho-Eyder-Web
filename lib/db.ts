// Conexão SQLite (better-sqlite3), criação da tabela e registros iniciais.
// Este é o único lugar do projeto que acessa o arquivo do banco de dados.

import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import type { ShelfStatus } from "./types";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

// Livros pré-cadastrados na estante. work_id, título e capa são reais na Open Library
// (verificados com requisições ao vivo antes de fixar os valores).
const SEEDS: Array<{
  work_id: string;
  title: string;
  cover_url: string | null;
  status: ShelfStatus;
  note: string | null;
}> = [
  {
    work_id: "OL27482W",
    title: "The Hobbit",
    cover_url: "https://covers.openlibrary.org/b/id/14627509-M.jpg",
    status: "want_to_read",
    note: "Pretendo ler em breve.",
  },
  {
    work_id: "OL66554W",
    title: "Pride and Prejudice",
    cover_url: "https://covers.openlibrary.org/b/id/14348537-M.jpg",
    status: "reading",
    note: "Lendo agora, gostando muito.",
  },
  {
    work_id: "OL1168083W",
    title: "Nineteen Eighty-Four",
    cover_url: "https://covers.openlibrary.org/b/id/9267242-M.jpg",
    status: "read",
    note: null,
  },
  {
    work_id: "OL450063W",
    title: "Frankenstein; or, The Modern Prometheus",
    cover_url: "https://covers.openlibrary.org/b/id/12356249-M.jpg",
    status: "want_to_read",
    note: null,
  },
  {
    work_id: "OL1003040W",
    title: "Dom Casmurro",
    cover_url: "https://covers.openlibrary.org/b/id/647501-M.jpg",
    status: "read",
    note: "Clássico de Machado de Assis.",
  },
];

function ensureDataDir(): void {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
}

let db: Database.Database | undefined = undefined;

export function getDb(): Database.Database {
  // Retorna a conexão aberta, reutilizando-a entre chamadas.
  if (db) return db;

  // Em hot reload do `next dev` o módulo pode ser reavaliado; o globalThis
  // preserva a conexão já aberta para não criar conexões duplicadas nem reexecutar o seed.
  const globalDb = (globalThis as unknown as { __db?: Database.Database }).__db;
  if (globalDb) {
    db = globalDb;
    return db;
  }

  ensureDataDir();
  const connection = new Database(DB_PATH);
  db = connection;
  (globalThis as unknown as { __db?: Database.Database }).__db = connection;
  return connection;
}

export function initDb(): void {
  const connection = getDb();

  // user_version = 0 indica banco recém-criado: cria a tabela e semeia dentro de uma transação.
  // Depois define user_version = 1, então reinícios posteriores não duplicam os seeds.
  // Apagar apenas linhas não recria os dados; apagar o arquivo app.db restaura o estado inicial.
  const userVersion = connection.pragma("user_version", { simple: true }) as number;

  if (userVersion !== 0) return;

  connection.exec("BEGIN");
  try {
    connection.exec(`
      CREATE TABLE IF NOT EXISTS bookshelf (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        work_id TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        cover_url TEXT,
        status TEXT NOT NULL DEFAULT 'want_to_read'
          CHECK (status IN ('want_to_read','reading','read')),
        note TEXT CHECK (note IS NULL OR length(note) <= 500),
        created_at TEXT NOT NULL DEFAULT (datetime('now','localtime'))
      );
    `);

    const insert = connection.prepare(
      `INSERT INTO bookshelf (work_id, title, cover_url, status, note)
       VALUES (?, ?, ?, ?, ?)`
    );
    for (const seed of SEEDS) {
      insert.run(seed.work_id, seed.title, seed.cover_url, seed.status, seed.note ?? null);
    }

    connection.pragma("user_version = 1");
    connection.exec("COMMIT");
  } catch (err) {
    connection.exec("ROLLBACK");
    throw err;
  }
}
