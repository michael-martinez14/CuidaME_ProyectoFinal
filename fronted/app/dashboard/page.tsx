"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  apiFetch,
  obtenerToken,
  obtenerUsuario,
  cerrarSesion,
  type Usuario,
} from "@/lib/api";

type Circulo = { id: number; nombre: string | null };
type Paciente = {
  id: number;
  nombre: string;
  sexo: string;
  circulo: Circulo | null;
};
type Medicamento = {
  id: number;
  nombre: string;
  dosis: string;
  horaInicio: string;
  activo: boolean;
};
type Alerta = { id: number; tipo: string; mensaje: string };
type RankingItem = {
  posicion: number;
  usuario_id: number;
  nombre: string;
  puntos: number;
};
type MiembroResp = {
  usuario_id: number;
  nombre: string;
  correo: string;
  rol: string;
  estado: string;
  puntos: number;
};
type Invitacion = {
  miembro_id: number;
  circulo_id: number;
  circulo_nombre: string | null;
  paciente_nombre: string | null;
  rol: string;
};
type Puntos = { puntos_totales: number; puntos_este_mes: number };
type ChatMessage = { author: "assistant" | "user"; text: string };

export default function DashboardPage() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([]);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [ranking, setRanking] = useState<RankingItem[]>([]);
  const [miembros, setMiembros] = useState<MiembroResp[]>([]);
  const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
  const [puntos, setPuntos] = useState<Puntos | null>(null);
  const [cargando, setCargando] = useState(true);

  const [activeModal, setActiveModal] = useState<
    "medicamento" | "chatbot" | "paciente" | "circulo" | "invitaciones" | null
  >(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Formulario de medicamento
  const [medNombre, setMedNombre] = useState("");
  const [medDosis, setMedDosis] = useState("");
  const [medHora, setMedHora] = useState("08:00");
  const [medFrecuencia, setMedFrecuencia] = useState("24");
  const [medNotas, setMedNotas] = useState("");
  const [guardandoMed, setGuardandoMed] = useState(false);

  // Formulario de paciente
  const [pacNombre, setPacNombre] = useState("");
  const [pacFecha, setPacFecha] = useState("");
  const [pacSexo, setPacSexo] = useState("masculino");
  const [pacTelefono, setPacTelefono] = useState("");
  const [pacDireccion, setPacDireccion] = useState("");
  const [guardandoPac, setGuardandoPac] = useState(false);

  // Invitaciones
  const [invCorreo, setInvCorreo] = useState("");
  const [invRol, setInvRol] = useState("cuidador_secundario");
  const [invitando, setInvitando] = useState(false);
  const [invMensaje, setInvMensaje] = useState("");
  const [invError, setInvError] = useState("");

  // Chatbot
  const [chatInput, setChatInput] = useState("");
  const [enviandoChat, setEnviandoChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      author: "assistant",
      text: "Hola, soy tu asistente de CuidaME. ¿Qué necesitas hacer hoy?",
    },
  ]);

  const quickQuestions = [
    "¿Cuál es la próxima toma pendiente?",
    "Necesito configurar un recordatorio",
    "Hay un síntoma que quiero reportar",
  ];

  const cargarDatos = useCallback(async (u: Usuario) => {
    setCargando(true);
    try {
      const pacientes = await apiFetch<Paciente[]>("/pacientes");
      if (pacientes.length > 0) {
        const p = pacientes[0];
        setPaciente(p);

        const meds = await apiFetch<Medicamento[]>(
          `/medicamentos/paciente/${p.id}?activos=true`
        );
        setMedicamentos(meds);

        if (p.circulo) {
          const rank = await apiFetch<RankingItem[]>(
            `/gamificacion/ranking/${p.circulo.id}`
          );
          setRanking(rank);

          const mbrs = await apiFetch<MiembroResp[]>(
            `/circulos/${p.circulo.id}/miembros`
          );
          setMiembros(mbrs);
        }
      } else {
        setPaciente(null);
      }

      const al = await apiFetch<Alerta[]>("/alertas");
      setAlertas(al);

      const pts = await apiFetch<Puntos>(`/gamificacion/puntos/${u.id}`);
      setPuntos(pts);

      const invs = await apiFetch<Invitacion[]>("/circulos/invitaciones");
      setInvitaciones(invs);
    } catch (err) {
      console.error("Error cargando el dashboard:", err);
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
    cargarDatos(u);
  }, [router, cargarDatos]);

  const cerrarModal = () => {
    setActiveModal(null);
    setInvMensaje("");
    setInvError("");
  };

  function logout() {
    cerrarSesion();
    router.push("/login");
  }

  async function guardarMedicamento(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente) return;
    setGuardandoMed(true);
    try {
      await apiFetch("/medicamentos", {
        method: "POST",
        body: JSON.stringify({
          paciente_id: paciente.id,
          nombre: medNombre,
          dosis: medDosis,
          frecuencia_horas: Number(medFrecuencia),
          hora_inicio: medHora,
          instrucciones: medNotas,
        }),
      });
      setMedNombre("");
      setMedDosis("");
      setMedNotas("");
      cerrarModal();
      if (usuario) await cargarDatos(usuario);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoMed(false);
    }
  }

  async function guardarPaciente(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoPac(true);
    try {
      await apiFetch("/pacientes", {
        method: "POST",
        body: JSON.stringify({
          nombre: pacNombre,
          fecha_nacimiento: pacFecha,
          sexo: pacSexo,
          telefono: pacTelefono,
          direccion: pacDireccion,
        }),
      });
      setPacNombre("");
      setPacFecha("");
      setPacTelefono("");
      setPacDireccion("");
      cerrarModal();
      if (usuario) await cargarDatos(usuario);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo guardar");
    } finally {
      setGuardandoPac(false);
    }
  }

  async function invitarFamiliar(e: React.FormEvent) {
    e.preventDefault();
    if (!paciente?.circulo) return;
    setInvitando(true);
    setInvMensaje("");
    setInvError("");
    try {
      const data = await apiFetch<{ mensaje: string }>(
        `/circulos/${paciente.circulo.id}/invitar`,
        {
          method: "POST",
          body: JSON.stringify({ correo: invCorreo, rol: invRol }),
        }
      );
      setInvMensaje(data.mensaje);
      setInvCorreo("");
      const mbrs = await apiFetch<MiembroResp[]>(
        `/circulos/${paciente.circulo.id}/miembros`
      );
      setMiembros(mbrs);
    } catch (err) {
      setInvError(err instanceof Error ? err.message : "No se pudo invitar.");
    } finally {
      setInvitando(false);
    }
  }

  async function aceptarInvitacion(miembroId: number) {
    try {
      await apiFetch(`/circulos/invitaciones/${miembroId}/aceptar`, {
        method: "POST",
      });
      if (usuario) await cargarDatos(usuario);
      setActiveModal(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo aceptar.");
    }
  }

  async function rechazarInvitacion(miembroId: number) {
    try {
      await apiFetch(`/circulos/invitaciones/${miembroId}/rechazar`, {
        method: "POST",
      });
      if (usuario) await cargarDatos(usuario);
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo rechazar.");
    }
  }

  async function enviarChat(e: React.FormEvent) {
    e.preventDefault();
    const consulta = chatInput.trim();
    if (!consulta) return;
    setChatMessages((prev) => [...prev, { author: "user", text: consulta }]);
    setChatInput("");
    setEnviandoChat(true);
    try {
      const data = await apiFetch<{ respuesta: string }>("/chatbot/mensaje", {
        method: "POST",
        body: JSON.stringify({ consulta }),
      });
      setChatMessages((prev) => [
        ...prev,
        { author: "assistant", text: data.respuesta },
      ]);
    } catch (err) {
      setChatMessages((prev) => [
        ...prev,
        {
          author: "assistant",
          text: err instanceof Error ? err.message : "Error al responder.",
        },
      ]);
    } finally {
      setEnviandoChat(false);
    }
  }

  const miPosicion = usuario
    ? ranking.find((r) => r.usuario_id === usuario.id)?.posicion
    : undefined;

  const inputClass =
    "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent";

  return (
    <div className="flex min-h-screen bg-brand-deep text-white">
        {/* Sidebar */}
        <aside
          className={`transition-all duration-300 overflow-hidden border-r border-white/10 bg-[#182235] ${
            sidebarOpen ? "w-72 p-6" : "w-0 p-0 border-r-0"
          }`}
        >
          <div className="mb-8">
            <h2 className="text-xl font-bold leading-tight">Cuidado en familia</h2>
            <p className="mt-1 text-sm text-brand-muted">Todo en un solo lugar</p>
          </div>

          <nav className="space-y-2">
            <button className="flex w-full items-center gap-3 rounded-xl bg-brand-accent px-4 py-3 text-left font-medium text-brand-deep">
              Principal
            </button>
            <button
              onClick={() => setActiveModal("medicamento")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Medicamentos
            </button>
            <button
              onClick={() => setActiveModal("circulo")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Familiares
            </button>
            <button
              onClick={() => setActiveModal("invitaciones")}
              className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              <span>Invitaciones</span>
              {invitaciones.length > 0 && (
                <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-accent px-2 text-xs font-bold text-brand-deep">
                  {invitaciones.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveModal("chatbot")}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left hover:bg-white/10"
            >
              Asistente
            </button>
          </nav>

          <div className="mt-auto pt-10">
            <button
              onClick={logout}
              className="block w-full rounded-xl border border-white/10 px-4 py-3 text-center hover:border-red-400 hover:text-red-400"
            >
              Cerrar sesión
            </button>
          </div>
        </aside>

        {/* Columna derecha: barra superior + contenido */}
        <div className="flex flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-brand-darker px-6 py-3">
            <span className="text-lg font-semibold tracking-tight">CuidaME</span>
            <div className="flex items-center gap-3">
              <div className="text-right leading-tight">
                <p className="text-sm font-medium text-white">{usuario?.nombre ?? ""}</p>
                <p className="text-xs text-brand-muted">{usuario?.correo ?? ""}</p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-accent text-sm font-bold text-brand-deep">
                {usuario?.nombre ? usuario.nombre.charAt(0).toUpperCase() : "U"}
              </div>
            </div>
          </header>
          <main className="flex-1 px-6 py-8">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 hover:bg-white/10"
          >
            ☰
          </button>

          {invitaciones.length > 0 && (
            <button
              onClick={() => setActiveModal("invitaciones")}
              className="mb-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-brand-accent/40 bg-brand-accent/10 px-5 py-4 text-left"
            >
              <span className="text-sm font-medium text-brand-accent">
                Tienes {invitaciones.length} invitación
                {invitaciones.length > 1 ? "es" : ""} pendiente
                {invitaciones.length > 1 ? "s" : ""} a un círculo familiar.
              </span>
              <span className="text-sm font-semibold text-brand-accent">
                Ver →
              </span>
            </button>
          )}

          {cargando ? (
            <p className="text-brand-muted">Cargando tu panel...</p>
          ) : !paciente ? (
            <section className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center">
              <h1 className="text-2xl font-semibold">
                Aún no has registrado un paciente
              </h1>
              <p className="mx-auto mt-3 max-w-md text-sm text-brand-muted">
                Crea el perfil de tu ser querido para empezar a registrar
                medicamentos, ver alertas y coordinar al círculo familiar.
              </p>
              <button
                onClick={() => setActiveModal("paciente")}
                className="mt-6 rounded-md bg-brand-accent px-6 py-3 font-semibold text-brand-deep transition-colors hover:bg-white"
              >
                Crear paciente
              </button>
            </section>
          ) : (
            <>
              <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-8">
                <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                  <div className="max-w-3xl space-y-4">
                    
                    <div>
                      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                        Hola, {usuario?.nombre}. Hoy tienes el cuidado bajo
                        control.
                      </h1>
                      <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-muted sm:text-base">
                        Resumen del estado del paciente, próximas tomas, alertas
                        activas y el rendimiento del círculo familiar.
                      </p>
                    </div>
                  </div>

                  <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-brand-deep/50 p-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                        Paciente
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {paciente.nombre}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                        Medicamentos
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {medicamentos.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                        Alertas
                      </p>
                      <p className="mt-1 text-lg font-semibold text-brand-accent">
                        {alertas.length}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                        Ranking
                      </p>
                      <p className="mt-1 text-lg font-semibold">
                        {miPosicion ? `#${miPosicion}` : "—"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <article className="rounded-2xl border border-white/10 bg-brand-deep/45 p-5">
                    <p className="text-sm text-brand-muted">Puntos del mes</p>
                    <p className="mt-3 text-3xl font-semibold">
                      {puntos?.puntos_este_mes ?? 0}
                    </p>
                    <p className="mt-2 text-sm text-brand-muted">
                      {puntos?.puntos_totales ?? 0} en total
                    </p>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-brand-deep/45 p-5">
                    <p className="text-sm text-brand-muted">
                      Medicamentos activos
                    </p>
                    <p className="mt-3 text-3xl font-semibold">
                      {medicamentos.length}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-brand-deep/45 p-5">
                    <p className="text-sm text-brand-muted">Alertas abiertas</p>
                    <p className="mt-3 text-3xl font-semibold">
                      {alertas.length}
                    </p>
                  </article>
                  <article className="rounded-2xl border border-white/10 bg-brand-deep/45 p-5">
                    <p className="text-sm text-brand-muted">Ranking familiar</p>
                    <p className="mt-3 text-3xl font-semibold">
                      {miPosicion ? `#${miPosicion}` : "—"}
                    </p>
                  </article>
                </div>
              </section>

              <section className="mt-6 grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
                <div className="space-y-6">
                  <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Próximas tomas</h2>
                        <p className="mt-1 text-sm text-brand-muted">
                          Basado en los medicamentos activos del paciente.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModal("medicamento")}
                        className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-white"
                      >
                        + Medicamento
                      </button>
                    </div>

                    <div className="mt-5 grid gap-3">
                      {medicamentos.length === 0 ? (
                        <p className="text-sm text-brand-muted">
                          No hay medicamentos registrados todavía.
                        </p>
                      ) : (
                        medicamentos.map((med) => (
                          <div
                            key={med.id}
                            className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                          >
                            <div>
                              <p className="text-sm text-brand-muted">
                                {med.horaInicio}
                              </p>
                              <p className="mt-1 text-base font-semibold">
                                {med.nombre}
                              </p>
                              <p className="text-sm text-brand-muted">
                                {med.dosis}
                              </p>
                            </div>
                            <span className="inline-flex w-fit rounded-full bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-300">
                              Pendiente
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <h2 className="text-xl font-semibold">Alertas activas</h2>
                    <p className="mt-1 text-sm text-brand-muted">
                      Notificaciones de medicamento, citas y stock.
                    </p>

                    <div className="mt-5 space-y-3">
                      {alertas.length === 0 ? (
                        <p className="text-sm text-brand-muted">
                          No tienes alertas activas.
                        </p>
                      ) : (
                        alertas.map((alerta) => (
                          <div
                            key={alerta.id}
                            className="rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4 text-sm leading-6 text-brand-muted"
                          >
                            {alerta.mensaje}
                          </div>
                        ))
                      )}
                    </div>
                  </article>
                </div>

                <div className="space-y-6">
                  <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-xl font-semibold">Círculo familiar</h2>
                        <p className="mt-1 text-sm text-brand-muted">
                          Miembros del círculo y su ranking.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveModal("circulo")}
                        className="rounded-xl border border-white/10 px-3 py-2 text-sm font-medium hover:border-brand-accent hover:text-brand-accent"
                      >
                        Gestionar
                      </button>
                    </div>

                    <div className="mt-5 space-y-3">
                      {ranking.length === 0 ? (
                        <p className="text-sm text-brand-muted">
                          Aún no hay miembros con puntos.
                        </p>
                      ) : (
                        ranking.map((item) => (
                          <div
                            key={item.usuario_id}
                            className="flex items-center justify-between rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/15 text-sm font-semibold text-brand-accent">
                                {item.posicion}
                              </span>
                              <p className="font-medium">{item.nombre}</p>
                            </div>
                            <p className="text-sm font-semibold text-white">
                              {item.puntos} pts
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </article>

                  <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
                    <h2 className="text-xl font-semibold">Accesos rápidos</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                      <button
                        onClick={() => setActiveModal("medicamento")}
                        className="rounded-2xl border border-white/10 bg-brand-deep/45 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                      >
                        Registrar medicamento
                      </button>
                      <button
                        onClick={() => setActiveModal("circulo")}
                        className="rounded-2xl border border-white/10 bg-brand-deep/45 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                      >
                        Invitar familiar
                      </button>
                      <button
                        onClick={() => setActiveModal("chatbot")}
                        className="rounded-2xl border border-white/10 bg-brand-deep/45 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                      >
                        Abrir asistente
                      </button>
                    </div>
                  </article>
                </div>
              </section>
            </>
          )}
        </main>
      </div>

      {/* Modal crear paciente */}
      {activeModal === "paciente" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold">Nuevo paciente</h3>
              <button
                onClick={cerrarModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>
            <form onSubmit={guardarPaciente} className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Nombre</span>
                <input
                  required
                  value={pacNombre}
                  onChange={(e) => setPacNombre(e.target.value)}
                  placeholder="Roberto López"
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-brand-muted">
                  Fecha de nacimiento
                </span>
                <input
                  required
                  type="date"
                  value={pacFecha}
                  onChange={(e) => setPacFecha(e.target.value)}
                  className={inputClass}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Sexo</span>
                <select
                  value={pacSexo}
                  onChange={(e) => setPacSexo(e.target.value)}
                  className={inputClass}
                >
                  <option className="bg-slate-900" value="masculino">
                    Masculino
                  </option>
                  <option className="bg-slate-900" value="femenino">
                    Femenino
                  </option>
                  <option className="bg-slate-900" value="otro">
                    Otro
                  </option>
                </select>
              </label>
              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Teléfono</span>
                <input
                  value={pacTelefono}
                  onChange={(e) => setPacTelefono(e.target.value)}
                  placeholder="+504 ..."
                  className={inputClass}
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-brand-muted">Dirección</span>
                <input
                  value={pacDireccion}
                  onChange={(e) => setPacDireccion(e.target.value)}
                  placeholder="Ciudad, país"
                  className={inputClass}
                />
              </label>
              <div className="flex justify-end gap-3 md:col-span-2">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPac}
                  className="rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-deep hover:bg-white disabled:opacity-50"
                >
                  {guardandoPac ? "Guardando..." : "Guardar paciente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal crear medicamento */}
      {activeModal === "medicamento" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold">Nuevo medicamento</h3>
              <button
                onClick={cerrarModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            {!paciente ? (
              <p className="mt-6 text-sm text-brand-muted">
                Primero crea un paciente para poder registrar medicamentos.
              </p>
            ) : (
              <form onSubmit={guardarMedicamento} className="mt-6 grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm text-brand-muted">Nombre</span>
                  <input
                    required
                    value={medNombre}
                    onChange={(e) => setMedNombre(e.target.value)}
                    placeholder="Metformina"
                    className={inputClass}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-brand-muted">Dosis</span>
                  <input
                    required
                    value={medDosis}
                    onChange={(e) => setMedDosis(e.target.value)}
                    placeholder="500 mg"
                    className={inputClass}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-brand-muted">Hora de inicio</span>
                  <input
                    required
                    type="time"
                    value={medHora}
                    onChange={(e) => setMedHora(e.target.value)}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm text-brand-muted">Frecuencia</span>
                  <select
                    value={medFrecuencia}
                    onChange={(e) => setMedFrecuencia(e.target.value)}
                    className={inputClass}
                  >
                    <option className="bg-slate-900" value="24">
                      Cada 24 horas (diaria)
                    </option>
                    <option className="bg-slate-900" value="12">
                      Cada 12 horas
                    </option>
                    <option className="bg-slate-900" value="8">
                      Cada 8 horas
                    </option>
                    <option className="bg-slate-900" value="6">
                      Cada 6 horas
                    </option>
                  </select>
                </label>
                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm text-brand-muted">Instrucciones</span>
                  <textarea
                    rows={3}
                    value={medNotas}
                    onChange={(e) => setMedNotas(e.target.value)}
                    placeholder="Tomar con comida"
                    className={inputClass}
                  />
                </label>
                <div className="flex justify-end gap-3 md:col-span-2">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white hover:border-white/20"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={guardandoMed}
                    className="rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-deep hover:bg-white disabled:opacity-50"
                  >
                    {guardandoMed ? "Guardando..." : "Guardar medicamento"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Modal círculo familiar (miembros + invitar) */}
      {activeModal === "circulo" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold">Círculo familiar</h3>
              <button
                onClick={cerrarModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            {!paciente?.circulo ? (
              <p className="mt-6 text-sm text-brand-muted">
                Primero crea un paciente para tener un círculo familiar.
              </p>
            ) : (
              <>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                    Miembros
                  </h4>
                  <div className="mt-3 space-y-2">
                    {miembros.length === 0 ? (
                      <p className="text-sm text-brand-muted">
                        Sin miembros todavía.
                      </p>
                    ) : (
                      miembros.map((m) => (
                        <div
                          key={m.usuario_id}
                          className="flex items-center justify-between rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-3"
                        >
                          <div>
                            <p className="font-medium">{m.nombre}</p>
                            <p className="text-xs text-brand-muted">{m.correo}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-brand-accent">
                              {m.rol.replace(/_/g, " ")}
                            </p>
                            <p className="text-xs text-brand-muted">{m.estado}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <form
                  onSubmit={invitarFamiliar}
                  className="mt-6 border-t border-white/10 pt-6"
                >
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-brand-muted">
                    Invitar familiar
                  </h4>
                  <p className="mt-1 text-xs text-brand-muted">
                    El familiar debe estar registrado en CuidaME con ese correo.
                    La invitación le aparecerá en su panel.
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <input
                      required
                      type="email"
                      value={invCorreo}
                      onChange={(e) => setInvCorreo(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className={inputClass}
                    />
                    <select
                      value={invRol}
                      onChange={(e) => setInvRol(e.target.value)}
                      className={inputClass}
                    >
                      <option className="bg-slate-900" value="cuidador_secundario">
                        Cuidador secundario
                      </option>
                      <option className="bg-slate-900" value="cuidador_principal">
                        Cuidador principal
                      </option>
                      <option className="bg-slate-900" value="observador">
                        Observador
                      </option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    disabled={invitando}
                    className="mt-3 rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-deep hover:bg-white disabled:opacity-50"
                  >
                    {invitando ? "Invitando..." : "Enviar invitación"}
                  </button>

                  {invMensaje && (
                    <p className="mt-3 text-sm text-brand-accent">{invMensaje}</p>
                  )}
                  {invError && (
                    <p className="mt-3 text-sm text-red-400">{invError}</p>
                  )}
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Modal invitaciones recibidas */}
      {activeModal === "invitaciones" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-2xl font-semibold">Mis invitaciones</h3>
              <button
                onClick={cerrarModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {invitaciones.length === 0 ? (
                <p className="text-sm text-brand-muted">
                  No tienes invitaciones pendientes.
                </p>
              ) : (
                invitaciones.map((inv) => (
                  <div
                    key={inv.miembro_id}
                    className="rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4"
                  >
                    <p className="font-medium">
                      {inv.circulo_nombre || "Círculo familiar"}
                    </p>
                    <p className="text-sm text-brand-muted">
                      Paciente: {inv.paciente_nombre || "—"} · Rol:{" "}
                      {inv.rol.replace(/_/g, " ")}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => aceptarInvitacion(inv.miembro_id)}
                        className="rounded-xl bg-brand-accent px-4 py-2 text-sm font-semibold text-brand-deep hover:bg-white"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => rechazarInvitacion(inv.miembro_id)}
                        className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white hover:border-red-400 hover:text-red-400"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Chatbot */}
      {activeModal === "chatbot" && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#0d1d2f] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 bg-brand-deep/80 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">
                Chatbot
              </p>
              <h3 className="text-base font-semibold text-white">
                Asistente CuidaME
              </h3>
            </div>
            <button
              onClick={cerrarModal}
              aria-label="Cerrar chatbot"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-brand-muted hover:border-white/20 hover:text-white"
            >
              X
            </button>
          </div>

          <div className="max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
            {chatMessages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.author === "assistant" ? "justify-start" : "justify-end"
                }`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.author === "assistant"
                      ? "border border-white/10 bg-white/5 text-white"
                      : "bg-brand-accent text-brand-deep"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

            <div className="space-y-2 pt-2">
              <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                Preguntas sugeridas
              </p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    onClick={() => setChatInput(question)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white hover:border-brand-accent hover:text-brand-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form onSubmit={enviarChat} className="border-t border-white/10 p-3">
            <div className="flex gap-2">
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe tu pregunta..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent"
              />
              <button
                type="submit"
                disabled={enviandoChat}
                className="rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-brand-deep hover:bg-white disabled:opacity-50"
              >
                {enviandoChat ? "..." : "Enviar"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
