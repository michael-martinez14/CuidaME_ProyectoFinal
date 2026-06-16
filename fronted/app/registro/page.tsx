"use client";

import { useState } from "react";
import Link from "next/link";

export default function RegistroPage() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [telefono, setTelefono] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!nombre || !correo || !contrasena || !confirmar) {
      setError("Completa todos los campos obligatorios.");
      return;
    }
    if (contrasena.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (contrasena !== confirmar) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setCargando(true);
    try {
      console.log("registro:", { nombre, correo, contrasena, telefono });
    } catch {
      setError("No se pudo crear la cuenta. Intenta de nuevo.");
    } finally {
      setCargando(false);
    }
  }

  const inputClass =
    "w-full rounded-md border border-white/15 bg-brand-deep/60 px-4 py-2.5 text-white placeholder:text-white/30 focus:border-brand-accent focus:outline-none";
  const labelClass = "mb-1 block text-sm font-medium text-white/80";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-deep px-6 py-12">
      {/* Logo */}
      <Link href="/" className="mb-8 text-2xl font-semibold tracking-tight text-white">
        CuidaME
      </Link>

      {/* Card */}
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 backdrop-blur">
        <h1 className="text-2xl font-semibold text-white">Crear cuenta</h1>
        <p className="mt-1 text-sm text-brand-muted">
          Únete y empieza a cuidar a los tuyos.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label htmlFor="nombre" className={labelClass}>
              Nombre completo
            </label>
            <input
              id="nombre"
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="María López"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="correo" className={labelClass}>
              Correo electrónico
            </label>
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="tu@correo.com"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="telefono" className={labelClass}>
              Teléfono <span className="text-white/40">(opcional)</span>
            </label>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="+504 9876-5432"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="contrasena" className={labelClass}>
              Contraseña
            </label>
            <input
              id="contrasena"
              type="password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
              placeholder="Mínimo 8 caracteres"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="confirmar" className={labelClass}>
              Confirmar contraseña
            </label>
            <input
              id="confirmar"
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              placeholder="Repite tu contraseña"
              className={inputClass}
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
            {cargando ? "Creando cuenta..." : "Registrarse"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-brand-muted">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-brand-accent hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
