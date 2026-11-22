import type { Metadata } from "next";
import type { ReactNode } from "react";
import Header from "../components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Catálogo de Livros",
  description: "Busque livros, veja detalhes de obras e autores e organize sua estante de leitura.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a href="#conteudo" className="skip-link">
          Ir para o conteúdo
        </a>
        <Header />
        <main id="conteudo" className="container main">
          {children}
        </main>
        <footer className="site-footer">
          <div className="container">
            Dados fornecidos pela Open Library
          </div>
        </footer>
      </body>
    </html>
  );
}
