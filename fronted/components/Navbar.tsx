import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-brand-deep/95 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-semibold tracking-tight text-white">
            CuidaME
          </span>
        </Link>

        {/* Enlaces esenciales */}
        <div className="flex items-center gap-8">

          {/* Botón de inicio de sesión */}
          <Link
            href="/login"
            className="rounded-md bg-white px-5 py-2 text-sm font-semibold uppercase tracking-wide text-brand-deep transition-colors hover:bg-brand-accent"
          >
            Iniciar sesión
          </Link>
        </div>
      </nav>
    </header>
  );
}
