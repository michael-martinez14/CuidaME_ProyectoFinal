"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!correo || !contrasena) {
      setError("Completa todos los campos.");
      return;
    }

    setCargando(true);
    try {
      console.log("login:", { correo, contrasena });
      router.push("/dashboard");
    } catch {
      setError("No se pudo iniciar sesión. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-brand-deep via-brand-dark to-brand-navy px-6">
      {/* Logo */}
      <Link href="/" className="mb-8 text-2xl font-semibold tracking-tight text-white">
        CuidaME
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Iniciar sesión</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Bienvenido de vuelta, tu familia te espera.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="correo" className="mb-1 block text-sm font-medium text-white/80">
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className="w-full rounded-md border border-white/15 bg-brand-deep/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-accent focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="contrasena" className="mb-1 block text-sm font-medium text-white/80">
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-md border border-white/15 bg-brand-deep/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-accent focus:outline-none"
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-2 h-11 rounded-md bg-brand-accent font-semibold text-brand-deep transition-colors hover:bg-white disabled:opacity-50"
          >
            {cargando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-brand-accent hover:underline">
            Regístrate
          </Link>
        </p>
      </div>
    </div>
  );
}
