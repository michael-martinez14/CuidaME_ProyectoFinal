import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-brand-deep via-brand-dark to-brand-navy">
      <Navbar />

      {/* Hero */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-8 select-none whitespace-nowrap text-center text-[22vw] font-semibold leading-none tracking-tight text-white/[0.04]"
        >
          CuidaME
        </span>

        {/* Contenido del hero */}
        <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 flex-col items-start justify-center gap-6 px-6 py-24">
          <span className="rounded-full border border-brand-accent/40 bg-brand-accent/10 px-4 py-1 text-sm font-medium text-brand-accent">
            Cuidado familiar
          </span>

          <h1 className="max-w-3xl text-5xl font-semibold leading-tight tracking-tight text-white sm:text-6xl">
            El cuidado de tu familia, <br className="hidden sm:block" />
            en un solo lugar.
          </h1>

          <p className="max-w-xl text-lg leading-8 text-brand-muted">
            CuidaME ayuda a las familias a cuidar a sus seres queridos con
            enfermedades crónicas: medicamentos, síntomas y alertas, con
            puntos y rangos que premian al cuidador más constante.
          </p>

          <div className="mt-4 flex flex-col gap-4 sm:flex-row">
            <Link
              href="/registro"
              className="flex h-12 items-center justify-center rounded-md bg-brand-accent px-8 text-base font-semibold text-brand-deep transition-colors hover:bg-white"
            >
              Comenzar ahora
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
