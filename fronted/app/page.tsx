import Image from "next/image";
import Link from "next/link";
import Navbar from "@/components/Navbar";

const caracteristicas = [
  {
    titulo: "Medicamentos y recordatorios",
    descripcion:
      "Registra dosis, frecuencia y horarios. Recibe avisos de cada toma y confirma cuándo se cumplió.",
  },
  {
    titulo: "Círculo familiar",
    descripcion:
      "Invita a familiares, asigna roles de cuidador y coordinen el cuidado en equipo.",
  },
  {
    titulo: "Síntomas y signos vitales",
    descripcion:
      "Lleva el historial de presión, glucosa y peso, y expórtalo en PDF para las citas médicas.",
  },
  {
    titulo: "Alertas inteligentes",
    descripcion:
      "Notificaciones de tomas pendientes, citas próximas y niveles de stock por debajo del mínimo.",
  },
  {
    titulo: "Puntos y rangos",
    descripcion:
      "Premia al cuidador más constante con puntos, rangos y badges familiares.",
  },
  {
    titulo: "Asistente CuidaME",
    descripcion:
      "Un chatbot que te ayuda a identificar síntomas.",
  },
];

const pasos = [
  {
    numero: "1",
    titulo: "Crea el perfil del paciente",
    descripcion:
      "Registra los datos de tu ser querido, sus enfermedades y sus médicos en un solo lugar.",
  },
  {
    numero: "2",
    titulo: "Invita a tu círculo familiar",
    descripcion:
      "Suma a la familia y asigna quién será el cuidador responsable de cada tarea.",
  },
  {
    numero: "3",
    titulo: "Registra y recibe alertas",
    descripcion:
      "Agrega medicamentos y mediciones; CuidaME avisa a todos cuando algo necesita atención.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-brand-deep">
      <Navbar />

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="relative flex flex-col overflow-hidden">
          <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-12 px-6 py-24 lg:grid-cols-2">
            {/* Texto del hero */}
            <div className="flex flex-col items-start gap-6">
              

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
        </section>

        {/* Características */}
        <section
          id="caracteristicas"
          className="border-t border-white/10 bg-brand-dark/30"
        >
          <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-2xl font-bold uppercase tracking-wide text-brand-accent sm:text-4xl">
                Características
              </span>
              <h2 className="mt-4 text-1xl font-semibold tracking-tight text-white sm:text-1xl">
                Todo lo que tu familia necesita para cuidar mejor
              </h2>
              <p className="mt-4 text-lg leading-8 text-brand-muted">
                Herramientas pensadas para el cuidado de enfermedades crónicas,
                en equipo y sin perder nada de vista.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {caracteristicas.map((item) => (
                <div
                  key={item.titulo}
                  className="rounded-2xl border border-white/10 bg-white/5 p-6 transition-colors hover:border-brand-accent/40"
                >
                  <h3 className="text-lg font-semibold text-white">
                    {item.titulo}
                  </h3>
                  <p className="mt-3 text-base leading-7 text-brand-muted">
                    {item.descripcion}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" className="border-t border-white/10">
          <div className="mx-auto w-full max-w-7xl px-6 pb-24 pt-12">
            <div className="mx-auto max-w-2xl text-center">
              <span className="text-2xl font-bold uppercase tracking-wide text-brand-accent sm:text-4xl">
                Cómo funciona
              </span>
              <h2 className="mt-4 text-1xl font-semibold tracking-tight text-white sm:text-1xl">
                Empieza en tres pasos
              </h2>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              {pasos.map((paso) => (
                <div key={paso.numero} className="flex flex-col items-start gap-4">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent text-lg font-bold text-brand-deep">
                    {paso.numero}
                  </span>
                  <h3 className="text-xl font-semibold text-white">
                    {paso.titulo}
                  </h3>
                  <p className="text-base leading-7 text-brand-muted">
                    {paso.descripcion}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 flex justify-center">
              <Link
                href="/registro"
                className="flex h-12 items-center justify-center rounded-md bg-brand-accent px-8 text-base font-semibold text-brand-deep transition-colors hover:bg-white"
              >
                Comenzar ahora
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 bg-brand-darker">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <span className="text-xl font-semibold tracking-tight text-white">
              CuidaME
            </span>
            <p className="mt-3 text-sm leading-6 text-brand-muted">
              Desarrollo de Aplicaciones de Vanguardia
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="text-sm font-semibold text-white">Cuenta</span>
            <Link
              href="/login"
              className="text-sm text-brand-muted transition-colors hover:text-white"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
