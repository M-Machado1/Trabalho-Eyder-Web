// Funções pequenas de formatação para a interface

export function formatYear(year: number | null): string {
  return year === null ? "Ano não informado" : String(year);
}

export function formatAuthors(authors: string[]): string {
  return authors.length > 0 ? authors.join(", ") : "Autor desconhecido";
}

// O SQLite guarda a data como "2026-11-14 10:30:00"; trocamos o espaço por "T"
// para o JavaScript entender em qualquer navegador.
export function formatDate(value: string): string {
  const date = new Date(value.replace(" ", "T"));
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleDateString("pt-BR");
}
