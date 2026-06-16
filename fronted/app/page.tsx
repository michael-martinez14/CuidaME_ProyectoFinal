import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-deep">
      <Navbar />

      {/* Hero */}
      <main className="relative flex flex-1 flex-col overflow-hidden">
        <div className="relative z-10 mx-auto grid w-full max-w-7xl flex-1 grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2">
          {/* Texto del hero */}
          <div className="flex flex-col items-start gap-6">
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

          {/* Imagen del hero */}
          <div className="relative w-full overflow-hidden rounded-2xl shadow-2xl">
            <Image
              src="/recursos/Imagen main web.avif"
              alt="Cuidadora atendiendo a una persona mayor"
              width={800}
              height={600}
              priority
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </main>
    </div>
  );
}
