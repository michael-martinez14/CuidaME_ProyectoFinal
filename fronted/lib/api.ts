// Helper central para hablar con el backend de CuidaME.
// Guarda el token y el usuario en localStorage y agrega el header de
// autorización automáticamente en cada petición.

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export type Usuario = {
  id: number;
  nombre: string;
  correo: string;
};

const TOKEN_KEY = "cuidame_token";
const USUARIO_KEY = "cuidame_usuario";

export function guardarSesion(token: string, usuario: Usuario) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USUARIO_KEY, JSON.stringify(usuario));
}

export function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function obtenerUsuario(): Usuario | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USUARIO_KEY);
  return raw ? (JSON.parse(raw) as Usuario) : null;
}

export function cerrarSesion() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USUARIO_KEY);
}

// Realiza una petición al backend. Lanza un Error con el mensaje del
// backend si la respuesta no es satisfactoria.
export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = obtenerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const mensaje =
      (data && (data.detalle || data.error)) || "Ocurrió un error en la solicitud";
    throw new Error(mensaje);
  }

  return data as T;
}

// ---------------------------------------------------------------------------
// Gamificación
// ---------------------------------------------------------------------------

export type Puntos = {
  usuario_id: number;
  nombre: string;
  puntos_totales: number;
  puntos_este_mes: number;
};

export type RankingItem = {
  posicion: number;
  usuario_id: number;
  nombre: string;
  puntos: number;
  badge_destacado: string;
};

export type Badge = {
  id: number;
  nombre: string;
  descripcion: string | null;
  icono_url: string | null;
  obtenido_en: string;
};

// Tipos de acción que el backend reconoce y los puntos que otorga cada uno.
export type TipoAccion =
  | "confirmar_toma"
  | "registrar_sintoma"
  | "invitar_familiar";

export const PUNTOS_POR_ACCION: Record<TipoAccion, number> = {
  confirmar_toma: 18,
  registrar_sintoma: 5,
  invitar_familiar: 15,
};

export type AccionResultado = {
  mensaje: string;
  puntos_sumados: number;
  puntos_totales: number;
};

export type AccionHistorial = {
  id: number;
  tipo: TipoAccion | string;
  puntos: number;
  creado_en: string;
};

export function obtenerPuntos(usuarioId: number) {
  return apiFetch<Puntos>(`/gamificacion/puntos/${usuarioId}`);
}

export function obtenerHistorial(usuarioId: number) {
  return apiFetch<AccionHistorial[]>(`/gamificacion/historial/${usuarioId}`);
}

export function obtenerRanking(circuloId: number) {
  return apiFetch<RankingItem[]>(`/gamificacion/ranking/${circuloId}`);
}

export function obtenerBadges(usuarioId: number) {
  return apiFetch<Badge[]>(`/gamificacion/badges/${usuarioId}`);
}

export function registrarAccion(
  usuarioId: number,
  tipoAccion: TipoAccion,
  referenciaId?: number
) {
  return apiFetch<AccionResultado>("/gamificacion/accion", {
    method: "POST",
    body: JSON.stringify({
      usuario_id: usuarioId,
      tipo_accion: tipoAccion,
      referencia_id: referenciaId,
    }),
  });
}

// ---------------------------------------------------------------------------
// Alertas / notificaciones
// ---------------------------------------------------------------------------

export type Alerta = {
  id: number;
  tipo: string;
  mensaje: string;
  leida: boolean;
  referenciaId: number | null;
  creadaEn: string;
};

export function obtenerAlertas(tipo?: string) {
  const query = tipo ? `?tipo=${encodeURIComponent(tipo)}` : "";
  return apiFetch<Alerta[]>(`/alertas${query}`);
}

export function crearAlerta(tipo: string, mensaje: string, referenciaId?: number) {
  return apiFetch<Alerta>("/alertas", {
    method: "POST",
    body: JSON.stringify({ tipo, mensaje, referencia_id: referenciaId }),
  });
}

export function marcarAlertaLeida(alertaId: number) {
  return apiFetch<{ mensaje: string }>(`/alertas/${alertaId}/leer`, {
    method: "PATCH",
  });
}

// ---------------------------------------------------------------------------
// Síntomas
// ---------------------------------------------------------------------------

export type IntensidadSintoma = "leve" | "moderada" | "severa";

export type Sintoma = {
  id: number;
  descripcion: string;
  intensidad: IntensidadSintoma | null;
  fechaHora: string;
  pacienteId: number;
  registradoPorId: number | null;
  registradoPor?: { id: number; nombre: string } | null;
};

export function obtenerSintomas(pacienteId: number) {
  return apiFetch<Sintoma[]>(`/sintomas/paciente/${pacienteId}`);
}

export function registrarSintoma(
  pacienteId: number,
  descripcion: string,
  intensidad?: IntensidadSintoma
) {
  return apiFetch<Sintoma & { puntos_sumados: number }>("/sintomas", {
    method: "POST",
    body: JSON.stringify({
      paciente_id: pacienteId,
      descripcion,
      intensidad,
    }),
  });
}

export function eliminarSintoma(sintomaId: number) {
  return apiFetch<{ mensaje: string }>(`/sintomas/${sintomaId}`, {
    method: "DELETE",
  });
}
