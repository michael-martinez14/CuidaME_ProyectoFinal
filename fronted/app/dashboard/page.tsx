"use client";

import { useState } from "react";
import Link from "next/link";

const proximasTomas = [
  {
    hora: "08:00",
    nombre: "Metformina",
    dosis: "500 mg",
    estado: "Pendiente",
  },
  {
    hora: "12:00",
    nombre: "Losartán",
    dosis: "50 mg",
    estado: "Confirmado",
  },
  {
    hora: "20:00",
    nombre: "Vitamina D",
    dosis: "1 cápsula",
    estado: "Pendiente",
  },
];

const alertas = [
  "La toma de Metformina aún no se confirma.",
  "Hay una cita médica programada para mañana a las 10:30.",
  "El stock de tiras reactivas está por debajo del mínimo.",
];

const ranking = [
  { nombre: "María López", puntos: 340, rol: "Cuidadora principal" },
  { nombre: "Juan López", puntos: 280, rol: "Cuidador secundario" },
  { nombre: "Ana López", puntos: 190, rol: "Observadora" },
];

const badges = ["Cuidador del mes", "Toma perfecta", "Círculo activo"];

export default function DashboardPage() {
  const [activeModal, setActiveModal] = useState<"medicamento" | "chatbot" | null>(null);
  const [chatInput, setChatInput] = useState("");

  const chatMessages = [
    {
      author: "assistant",
      text: "Hola, soy tu asistente de CuidaME. ¿Qué necesitas hacer hoy?",
    },
    {
      author: "assistant",
      text: "¿Quieres registrar un medicamento nuevo o revisar una toma pendiente?",
    },
    {
      author: "assistant",
      text: "También puedo ayudarte a revisar síntomas, recordatorios o citas.",
    },
  ];

  const quickQuestions = [
    "Quiero registrar un medicamento nuevo",
    "¿Cuál es la próxima toma pendiente?",
    "Necesito configurar un recordatorio",
    "Hay un síntoma que quiero reportar",
  ];

  const closeModal = () => {
    setActiveModal(null);
    setChatInput("");
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(45,212,167,0.14),_transparent_28%),linear-gradient(180deg,_#0b1d1a_0%,_#0e2235_100%)] text-white">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-8">
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-4">
              <span className="inline-flex rounded-full border border-brand-accent/30 bg-brand-accent/10 px-4 py-1 text-sm font-medium text-brand-accent">
                Panel principal
              </span>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                  Buenos días, María. Hoy tienes el cuidado bajo control.
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-brand-muted sm:text-base">
                  Esta vista resume el estado del paciente, las próximas tomas,
                  alertas activas y el rendimiento del círculo familiar para que
                  tengas una sola pantalla de trabajo al entrar.
                </p>
              </div>
            </div>

            <div className="grid min-w-[260px] grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-brand-deep/50 p-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                  Paciente
                </p>
                <p className="mt-1 text-lg font-semibold">Roberto López</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                  Última sincronización
                </p>
                <p className="mt-1 text-lg font-semibold">Hace 12 min</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                  Estado
                </p>
                <p className="mt-1 text-lg font-semibold text-brand-accent">Activo</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">
                  Citas
                </p>
                <p className="mt-1 text-lg font-semibold">1 próxima</p>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[
              { label: "Puntos del mes", value: "120", note: "+18 esta semana" },
              { label: "Medicamentos activos", value: "4", note: "2 pendientes hoy" },
              { label: "Alertas abiertas", value: "3", note: "1 crítica" },
              { label: "Ranking familiar", value: "#1", note: "+60 puntos sobre Juan" },
            ].map((item) => (
              <article
                key={item.label}
                className="rounded-2xl border border-white/10 bg-brand-deep/45 p-5"
              >
                <p className="text-sm text-brand-muted">{item.label}</p>
                <p className="mt-3 text-3xl font-semibold">{item.value}</p>
                <p className="mt-2 text-sm text-brand-muted">{item.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Próximas tomas</h2>
                  <p className="mt-1 text-sm text-brand-muted">
                    Seguimiento basado en los medicamentos activos del paciente.
                  </p>
                </div>
                <Link
                  href="/login"
                  className="rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                >
                  Cerrar sesión
                </Link>
              </div>

              <div className="mt-5 grid gap-3">
                {proximasTomas.map((toma) => (
                  <div
                    key={`${toma.hora}-${toma.nombre}`}
                    className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm text-brand-muted">{toma.hora}</p>
                      <p className="mt-1 text-base font-semibold">{toma.nombre}</p>
                      <p className="text-sm text-brand-muted">{toma.dosis}</p>
                    </div>
                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-medium ${
                        toma.estado === "Confirmado"
                          ? "bg-brand-accent/15 text-brand-accent"
                          : "bg-amber-400/15 text-amber-300"
                      }`}
                    >
                      {toma.estado}
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-xl font-semibold">Alertas activas</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Notificaciones relevantes de medicamento, citas y stock.
              </p>

              <div className="mt-5 space-y-3">
                {alertas.map((alerta) => (
                  <div
                    key={alerta}
                    className="rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4 text-sm leading-6 text-brand-muted"
                  >
                    {alerta}
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="space-y-6">
            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-xl font-semibold">Círculo familiar</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Integración con invitaciones, miembros y roles del círculo.
              </p>

              <div className="mt-5 space-y-3">
                {ranking.map((item, index) => (
                  <div
                    key={item.nombre}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-brand-deep/40 px-4 py-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-accent/15 text-sm font-semibold text-brand-accent">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{item.nombre}</p>
                          <p className="text-sm text-brand-muted">{item.rol}</p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm font-semibold text-white">{item.puntos} pts</p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-xl font-semibold">Gamificación</h2>
              <p className="mt-1 text-sm text-brand-muted">
                Puntos, badges y metas para reforzar la constancia del cuidador.
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-brand-accent/30 bg-brand-accent/10 px-3 py-1.5 text-sm text-brand-accent"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-2xl border border-white/10 bg-brand-deep/40 p-4">
                <p className="text-sm font-medium text-white">Meta semanal</p>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Completa 5 confirmaciones de toma para desbloquear 30 puntos
                  extra y mantener el badge de constancia.
                </p>
              </div>
            </article>

            <article className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
              <h2 className="text-xl font-semibold">Accesos rápidos</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                {[
                  "Registrar medicamento",
                  "Invitar familiar",
                  "Abrir chatbot",
                  "Ver historial",
                ].map((accion) => (
                  <button
                    key={accion}
                    type="button"
                    onClick={() => {
                      if (accion === "Registrar medicamento") {
                        setActiveModal("medicamento");
                      }

                      if (accion === "Abrir chatbot") {
                        setActiveModal("chatbot");
                      }
                    }}
                    className="rounded-2xl border border-white/10 bg-brand-deep/45 px-4 py-3 text-left text-sm font-medium text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                  >
                    {accion}
                  </button>
                ))}
              </div>
            </article>
          </div>
        </section>
      </main>

      {activeModal === "medicamento" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-[#0f2539] p-6 shadow-2xl shadow-black/30">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">
                  Registro de medicamento
                </p>
                <h3 className="mt-2 text-2xl font-semibold">Agrega los datos del medicamento</h3>
                <p className="mt-2 text-sm leading-6 text-brand-muted">
                  Completa la información para guardar una nueva medicina y sus recordatorios.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-white/10 px-3 py-1 text-sm text-brand-muted transition-colors hover:border-white/20 hover:text-white"
              >
                Cerrar
              </button>
            </div>

            <form
              className="mt-6 grid gap-4 md:grid-cols-2"
              onSubmit={(event) => {
                event.preventDefault();
                closeModal();
              }}
            >
              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Nombre del medicamento</span>
                <input
                  type="text"
                  placeholder="Ej. Metformina"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Dosis</span>
                <input
                  type="text"
                  placeholder="Ej. 500 mg"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Horario</span>
                <input
                  type="time"
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-accent"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm text-brand-muted">Frecuencia</span>
                <select className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-brand-accent">
                  <option className="bg-slate-900">Diaria</option>
                  <option className="bg-slate-900">Cada 8 horas</option>
                  <option className="bg-slate-900">Semanal</option>
                  <option className="bg-slate-900">Según indicación</option>
                </select>
              </label>

              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-brand-muted">Notas</span>
                <textarea
                  rows={4}
                  placeholder="Ej. Tomar después de comer y confirmar cada toma."
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent"
                />
              </label>

              <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-2xl border border-white/10 px-5 py-3 text-sm font-medium text-white transition-colors hover:border-white/20"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-2xl bg-brand-accent px-5 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-accent/90"
                >
                  Guardar medicamento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {activeModal === "chatbot" && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(92vw,22rem)] overflow-hidden rounded-3xl border border-white/10 bg-[#0d1d2f] shadow-2xl shadow-black/40">
          <div className="flex items-center justify-between border-b border-white/10 bg-brand-deep/80 px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-brand-muted">Chatbot</p>
              <h3 className="text-base font-semibold text-white">Asistente CuidaME</h3>
            </div>
            <button
              type="button"
              onClick={closeModal}
              aria-label="Cerrar chatbot"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-sm text-brand-muted transition-colors hover:border-white/20 hover:text-white"
            >
              ❌
            </button>
          </div>

          <div className="max-h-[28rem] space-y-3 overflow-y-auto px-4 py-4">
            {chatMessages.map((message) => (
              <div
                key={message.text}
                className={`flex ${message.author === "assistant" ? "justify-start" : "justify-end"}`}
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
              <p className="text-xs uppercase tracking-[0.22em] text-brand-muted">Preguntas sugeridas</p>
              <div className="flex flex-wrap gap-2">
                {quickQuestions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    onClick={() => setChatInput(question)}
                    className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-left text-xs text-white transition-colors hover:border-brand-accent hover:text-brand-accent"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form
            className="border-t border-white/10 p-3"
            onSubmit={(event) => {
              event.preventDefault();
              setChatInput("");
            }}
          >
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Escribe tu pregunta..."
                className="min-w-0 flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400 focus:border-brand-accent"
              />
              <button
                type="submit"
                className="rounded-2xl bg-brand-accent px-4 py-3 text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-accent/90"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}