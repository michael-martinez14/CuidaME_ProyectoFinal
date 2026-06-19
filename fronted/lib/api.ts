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
