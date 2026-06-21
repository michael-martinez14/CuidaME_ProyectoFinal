// Alarmas de medicamentos basadas en la Web Notifications API.
//
// Dado el listado de medicamentos del paciente (con su hora de inicio y
// frecuencia), calcula las horas de toma del día y dispara una notificación
// del navegador cuando llega cada una. Para no repetir la misma alarma se
// recuerda en localStorage qué tomas ya se notificaron hoy.

import { useEffect, useRef } from "react";

export type MedicamentoAlarma = {
  id: number;
  nombre: string;
  dosis: string;
  horaInicio: string; // "HH:mm"
  frecuenciaHoras?: number;
};

const FIRED_KEY = "cuidame_alarmas_disparadas";

export function notificacionesSoportadas(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function permisoNotificaciones(): NotificationPermission {
  if (!notificacionesSoportadas()) return "denied";
  return Notification.permission;
}

export async function solicitarPermisoNotificaciones(): Promise<NotificationPermission> {
  if (!notificacionesSoportadas()) return "denied";
  if (Notification.permission === "granted") return "granted";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

// Convierte "HH:mm" a minutos desde medianoche. Devuelve null si es inválido.
function horaAMinutos(hora: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec((hora || "").trim());
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

function minutosAHora(min: number): string {
  const h = Math.floor(min / 60) % 24;
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Convierte una hora "HH:mm" (24h) a formato de 12h con AM/PM, ej. "8:00 AM".
// Si la hora es inválida la devuelve tal cual.
export function formatHora12(hora: string): string {
  const min = horaAMinutos(hora);
  if (min === null) return hora;
  const m = min % 60;
  const h24 = Math.floor(min / 60);
  const sufijo = h24 < 12 ? "AM" : "PM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${sufijo}`;
}

// Todas las horas de toma de un medicamento dentro de un día (en minutos).
export function horariosDelDia(med: MedicamentoAlarma): number[] {
  const inicio = horaAMinutos(med.horaInicio);
  if (inicio === null) return [];
  const frecuencia = med.frecuenciaHoras && med.frecuenciaHoras > 0 ? med.frecuenciaHoras : 24;
  const paso = frecuencia * 60;
  const horarios: number[] = [];
  for (let t = inicio; t < 24 * 60; t += paso) {
    horarios.push(t);
  }
  return horarios;
}

// Próxima toma futura de la lista (texto "Nombre — HH:mm"), o null si no hay.
export function proximaToma(
  medicamentos: MedicamentoAlarma[],
  ahoraMinutos: number
): { medicamento: MedicamentoAlarma; hora: string } | null {
  let mejor: { medicamento: MedicamentoAlarma; minutos: number } | null = null;
  for (const med of medicamentos) {
    for (const t of horariosDelDia(med)) {
      if (t >= ahoraMinutos && (!mejor || t < mejor.minutos)) {
        mejor = { medicamento: med, minutos: t };
      }
    }
  }
  return mejor ? { medicamento: mejor.medicamento, hora: minutosAHora(mejor.minutos) } : null;
}

// Última toma del día cuya hora ya pasó (o es justo ahora), o null si la
// primera toma aún no llega. Sirve para mostrar la alerta "es hora de...".
export function tomaVencida(
  med: MedicamentoAlarma,
  ahoraMinutos: number
): { hora: string } | null {
  const pasadas = horariosDelDia(med).filter((t) => t <= ahoraMinutos);
  if (pasadas.length === 0) return null;
  return { hora: minutosAHora(Math.max(...pasadas)) };
}

function leerDisparadas(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    const data = raw ? (JSON.parse(raw) as { fecha: string; claves: string[] }) : null;
    const hoy = new Date().toDateString();
    if (!data || data.fecha !== hoy) return new Set();
    return new Set(data.claves);
  } catch {
    return new Set();
  }
}

function guardarDisparadas(claves: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      FIRED_KEY,
      JSON.stringify({ fecha: new Date().toDateString(), claves: [...claves] })
    );
  } catch {
    /* sin persistencia si localStorage falla */
  }
}

export type OpcionesAlarma = {
  activo?: boolean;
  // Callback opcional cuando se dispara una alarma (p. ej. para mostrarla en la UI).
  onAlarma?: (med: MedicamentoAlarma) => void;
};

/**
 * Hook que revisa cada 30s las horas de toma y dispara notificaciones del
 * navegador cuando corresponde. Solo actúa si el permiso fue concedido.
 */
export function useAlarmasMedicamentos(
  medicamentos: MedicamentoAlarma[],
  opciones: OpcionesAlarma = {}
) {
  const { activo = true, onAlarma } = opciones;
  const medsRef = useRef(medicamentos);
  const onAlarmaRef = useRef(onAlarma);
  medsRef.current = medicamentos;
  onAlarmaRef.current = onAlarma;

  useEffect(() => {
    if (!activo || !notificacionesSoportadas()) return;

    function revisar() {
      if (Notification.permission !== "granted") return;
      const ahora = new Date();
      const ahoraMin = ahora.getHours() * 60 + ahora.getMinutes();
      const disparadas = leerDisparadas();
      let cambio = false;

      for (const med of medsRef.current) {
        for (const t of horariosDelDia(med)) {
          // Disparamos si la hora de toma es el minuto actual (margen de 0 min).
          if (t !== ahoraMin) continue;
          const clave = `${med.id}-${t}`;
          if (disparadas.has(clave)) continue;

          try {
            new Notification("Hora de la toma — CuidaME", {
              body: `${med.nombre} (${med.dosis}) a las ${minutosAHora(t)}.`,
              tag: clave,
            });
          } catch {
            /* algunos navegadores bloquean Notification fuera de gesto de usuario */
          }
          onAlarmaRef.current?.(med);
          disparadas.add(clave);
          cambio = true;
        }
      }

      if (cambio) guardarDisparadas(disparadas);
    }

    revisar();
    const id = window.setInterval(revisar, 30_000);
    return () => window.clearInterval(id);
  }, [activo]);
}
