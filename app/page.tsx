import { Suspense } from "react";
import BookSearch from "../components/BookSearch";
import { Loading } from "../components/Feedback";

// Página inicial: busca paginada de livros.
// O Suspense é necessário porque BookSearch usa useSearchParams.
export default function HomePage() {
  return (
    <>
      <h1>Encontre seu próximo livro</h1>
      <Suspense fallback={<Loading />}>
        <BookSearch />
      </Suspense>
    </>
  );
}
