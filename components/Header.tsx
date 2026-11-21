"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Buscar livros" },
  { href: "/bookshelf", label: "Minha estante" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container header-inner">
        <Link href="/" className="brand">
          Catálogo de Livros
        </Link>
        <nav aria-label="Principal">
          <ul className="nav-list">
            {links.map((link) => {
              const active =
                link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="nav-link"
                    aria-current={active ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
