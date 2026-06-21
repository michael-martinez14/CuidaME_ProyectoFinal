"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  obtenerToken,
  obtenerUsuario,
  obtenerPuntos,
  obtenerRanking,
  obtenerBadges,
  obtenerAlertas,
  obtenerHistorial,
  marcarAlertaLeida,
  apiFetch,
  PUNTOS_POR_ACCION,
  type Usuario,
  type Puntos,
  type RankingItem,
  type Badge,
  type Alerta,
  type TipoAccion,
  type AccionHistorial,
} from "@/lib/api";
import {
  useAlarmasMedicamentos,
  solicitarPermisoNotificaciones,
  permisoNotificaciones,
  notificacionesSoportadas,
  proximaToma,
  formatHora12,
  type MedicamentoAlarma,
} from "@/lib/alarmas";

type Paciente = {
  id: number;
  nombre: string;
  circulo: { id: number; nombre: string | null } | null;
};

const ACCIONES: { tipo: TipoAccion; titulo: string; detalle: string }[] = [
  {
    tipo: "confirmar_toma",
    titulo: "Confirmar toma",
    detalle: "Se otorgan a quien marca una toma como realizada desde el panel.",
  },
  {
    tipo: "invitar_familiar",
    titulo: "Invitar familiar",
    detalle: "Se otorgan a quien invitó cuando el familiar acepta entrar al círculo.",
  },
  {
    tipo: "registrar_sintoma",
    titulo: "Registrar síntoma",
    detalle: "Se otorgan a quien anota un síntoma del paciente desde el panel.",
  },
];

// Etiqueta legible para cada tipo de acción del historial.
const ETIQUETAS_ACCION: Record<string, string> = {
  confirmar_toma: "Confirmar toma",
  registrar_sintoma: "Registrar síntoma",
  agendar_cita: "Agendar cita",
  invitar_familiar: "Invitar familiar",
};

export default function GamificacionPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicamentos, setMedicamentos] = useState<MedicamentoAlarma[]>([]);
  const [puntos, setPuntos] = useState<Puntos | null>(null);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [aviso, setAviso] = useState("");
  const [historial, setHistorial] = useState<AccionHistorial[]>([]);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  const [permiso, setPermiso] = useState<NotificationPermission>("default");

  const cargarDatos = useCallback(async (u: Usuario) => {
    setCargando(true);
    try {
      const [pts, bdgs, al, pacientes] = await Promise.all([
        obtenerPuntos(u.id),
        obtenerBadges(u.id),
        obtenerAlertas(),
        apiFetch<Paciente[]>("/pacientes"),
      ]);
      setPuntos(pts);
      setBadges(bdgs);
      setAlertas(al);

      if (pacientes.length > 0) {
        const p = pacientes[0];
        setPaciente(p);

        const meds = await apiFetch<MedicamentoAlarma[]>(
          `/medicamentos/paciente/${p.id}?activos=true`
        );
        setMedicamentos(meds);

        if (p.circulo) {
          const rank = await obtenerRanking(p.circulo.id);
          setRanking(rank);
        }
      }
    } catch (err) {
      console.error("Error cargando gamificación:", err);
      setAviso(err instanceof Error ? err.message : "No se pudieron cargar los datos.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    const token = obtenerToken();
    const u = obtenerUsuario();
    if (!token || !u) {
      router.push("/login");
      return;
    }
    setUsuario(u);
    setPermiso(permisoNotificaciones());
    cargarDatos(u);
  }, [router, cargarDatos]);

  useAlarmasMedicamentos(medicamentos, {
    activo: permiso === "granted",
    onAlarma: (med) =>
      setAviso(`Recordatorio: es hora de ${med.nombre} (${med.dosis}).`),
  });

  async function activarNotificaciones() {
    const resultado = await solicitarPermisoNotificaciones();
    setPermiso(resultado);
    if (resultado === "granted") {
      setAviso("Notificaciones activadas. Te avisaremos a la hora de cada toma.");
    } else {
      setAviso("No se concedió el permiso de notificaciones del navegador.");
    }
  }

  async function abrirHistorial() {
    if (!usuario) return;
    setMostrarHistorial(true);
    setCargandoHistorial(true);
    try {
      const h = await obtenerHistorial(usuario.id);
      setHistorial(h);
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "No se pudo cargar el historial.");
      setMostrarHistorial(false);
    } finally {
      setCargandoHistorial(false);
    }
  }

  async function marcarLeida(id: number) {
    try {
      await marcarAlertaLeida(id);
      setAlertas((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setAviso(err instanceof Error ? err.message : "No se pudo actualizar la alerta.");
    }
  }

  const ahora = new Date();
  const siguiente = proximaToma(medicamentos, ahora.getHours() * 60 + ahora.getMinutes());
  const miPosicion = usuario
    ? ranking.find((r) => r.usuario_id === usuario.id)?.posicion
    : undefined;

  const card = "rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur";

  return (
    <div className="min-h-screen bg-brand-deep text-white">
      <header className="flex items-center justify-between border-b border-white/10 bg-brand-darker px-6 py-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">CuidaME</p>
          <h1 className="text-xl font-semibold">Mis puntos y notificaciones</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={abrirHistorial}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium hover:border-brand-accent hover:text-brand-accent"
          >
            Historial de puntos
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium hover:border-brand-accent hover:text-brand-accent"
          >
            ← Volver al panel
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {aviso && (
          <div className="rounded-2xl border border-brand-accent/40 bg-brand-accent/10 px-5 py-3 text-sm text-brand-accent">
            {aviso}
          </div>
        )}

        {cargando ? (
          <p className="text-brand-muted">Cargando...</p>
        ) : (
          <>
            {/* Resumen de puntos */}
            <section className="grid gap-4 md:grid-cols-3">
              <article className={card}>
                <p className="text-sm text-brand-muted">Puntos este mes</p>
                <p className="mt-3 text-4xl font-semibold">{puntos?.puntos_este_mes ?? 0}</p>
              </article>
              <article className={card}>
                <p className="text-sm text-brand-muted">Puntos totales</p>
                <p className="mt-3 text-4xl font-semibold">{puntos?.puntos_totales ?? 0}</p>
              </article>
              <article className={card}>
                <p className="text-sm text-brand-muted">Mi posición en el círculo</p>
                <p className="mt-3 text-4xl font-semibold">
                  {miPosicion ? `#${miPosicion}` : "—"}
                </p>
              </article>
            </section>

            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              {/* Cómo se ganan los puntos (solo informativo) */}
              <section className={card}>
                <h2 className="text-xl font-semibold">¿Cómo ganar puntos?</h2>
                <p className="mt-1 text-sm text-brand-muted">
                  Los puntos se suman solos al realizar cada acción de cuidado. No
                  se pueden agregar manualmente.
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {ACCIONES.map((a) => (
                    <div
                      key={a.tipo}
                      className="flex flex-col items-start gap-1 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4 text-left"
                    >
                      <span className="flex w-full items-center justify-between gap-2">
                        <span className="font-medium">{a.titulo}</span>
                        <span className="rounded-full bg-brand-accent/15 px-2 py-1 text-xs font-semibold text-brand-accent">
                          +{PUNTOS_POR_ACCION[a.tipo]}
                        </span>
                      </span>
                      <span className="text-xs text-brand-muted">{a.detalle}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Ranking */}
              <section className={card}>
                <h2 className="text-xl font-semibold">Ranking del círculo</h2>
                <div className="mt-5 space-y-3">
                  {ranking.length === 0 ? (
                    <p className="text-sm text-brand-muted">Aún no hay miembros con puntos.</p>
                  ) : (
                    ranking.map((item) => (
                      <div
                        key={item.usuario_id}
                        className={`flex items-center justify-between rounded-2xl border px-4 py-3 ${
                          item.usuario_id === usuario?.id
                            ? "border-brand-accent/50 bg-brand-accent/10"
                            : "border-white/10 bg-brand-deep/40"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/15 text-sm font-semibold text-brand-accent">
                            {item.posicion}
                          </span>
                          <div>
                            <p className="font-medium">{item.nombre}</p>
                            {item.badge_destacado && (
                              <p className="text-xs text-brand-muted">🏅 {item.badge_destacado}</p>
                            )}
                          </div>
                        </div>
                        <p className="text-sm font-semibold">{item.puntos} pts</p>
                      </div>
                    ))
                  )}
                </div>
              </section>
            </div>

            {/* Badges */}
            

            {/* Notificaciones y alarmas */}
            <section className={card}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Notificaciones y alarmas</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    Recordatorios de tomas y alertas activas.
                  </p>
                </div>
                {notificacionesSoportadas() ? (
                  permiso === "granted" ? (
                    <span className="rounded-full bg-brand-accent/15 px-3 py-1 text-xs font-semibold text-brand-accent">
                      Alarmas activadas
                    </span>
                  ) : (
                    <button
                      onClick={activarNotificaciones}
                      className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-white"
                    >
                      Activar notificaciones
                    </button>
                  )
                ) : (
                  <span className="text-xs text-brand-muted">
                    Tu navegador no soporta notificaciones.
                  </span>
                )}
              </div>

              {siguiente && (
                <div className="mt-5 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-3 text-sm">
                  <span className="text-brand-muted">Próxima toma: </span>
                  <span className="font-medium">
                    {siguiente.medicamento.nombre} a las {formatHora12(siguiente.hora)}
                  </span>
                </div>
              )}

              <div className="mt-4 space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                  Alertas activas
                </h3>
                {alertas.length === 0 ? (
                  <p className="text-sm text-brand-muted">No tienes alertas activas.</p>
                ) : (
                  alertas.map((a) => (
                    <div
                      key={a.id}
                      className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-3"
                    >
                      <div>
                        <p className="text-xs uppercase tracking-wide text-brand-accent">
                          {a.tipo}
                        </p>
                        <p className="mt-1 text-sm text-brand-muted">{a.mensaje}</p>
                      </div>
                      <button
                        onClick={() => marcarLeida(a.id)}
                        className="shrink-0 rounded-xl border border-white/10 px-3 py-2 text-xs font-medium hover:border-brand-accent hover:text-brand-accent"
                      >
                        Marcar leída
                      </button>
                    </div>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Ventana: historial de puntos del usuario */}
      {mostrarHistorial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="flex max-h-[85vh] w-full max-w-xl flex-col rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold">Historial de puntos</h3>
                <p className="mt-1 text-sm text-brand-muted">
                  Puntos obtenidos por {usuario?.nombre}.
                </p>
              </div>
              <button
                onClick={() => setMostrarHistorial(false)}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-5 flex-1 space-y-3 overflow-y-auto">
              {cargandoHistorial ? (
                <p className="text-sm text-brand-muted">Cargando historial...</p>
              ) : historial.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  Todavía no has ganado puntos.
                </p>
              ) : (
                historial.map((h) => (
                  <div
                    key={h.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {ETIQUETAS_ACCION[h.tipo] || h.tipo}
                      </p>
                      <p className="text-xs text-brand-muted">
                        {new Date(h.creado_en).toLocaleString()}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-brand-accent/15 px-3 py-1 text-sm font-semibold text-brand-accent">
                      +{h.puntos}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
