import Link from "next/link";
import BookCover from "./BookCover";
import AddToShelfButton from "./AddToShelfButton";
import { formatAuthors, formatYear } from "../lib/format";
import type { BookSummary } from "../lib/types";

interface BookCardProps {
  book: BookSummary;
  showAuthors?: boolean; // na página do autor não precisa repetir o nome
}

export default function BookCard({ book, showAuthors = true }: BookCardProps) {
  return (
    <article className="book-card">
      <Link href={`/books/${encodeURIComponent(book.work_id)}`} className="book-card-link">
        <BookCover coverUrl={book.cover_url} title={book.title} decorative />
        <h3 className="book-card-title">{book.title}</h3>
      </Link>
      {showAuthors && <p className="muted">{formatAuthors(book.authors)}</p>}
      <p className="muted">{formatYear(book.first_publish_year)}</p>
      <AddToShelfButton book={book} />
    </article>
  );
}
