import { SERVER_UNREACHABLE } from "./messages";

/**
 * Base absoluta de la API.
 *
 * En la web desplegada en Vercel queda vacia: el frontend y la API viven en el
 * mismo dominio y los rewrites de `vercel.json` resuelven las rutas relativas.
 * En la app nativa (Capacitor) no hay "mismo dominio" que valga, asi que se
 * define `VITE_API_BASE_URL` con la URL de produccion y todas las rutas que
 * empiezan con "/" se reescriben contra ella.
 */
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? "").trim().replace(/\/+$/, "");

export function resolveApiUrl(input: RequestInfo | URL): RequestInfo | URL {
  if (!API_BASE_URL) return input;
  if (typeof input === "string" && input.startsWith("/")) return `${API_BASE_URL}${input}`;
  if (input instanceof Request && input.url.startsWith("/")) {
    return new Request(`${API_BASE_URL}${input.url}`, input);
  }
  return input;
}

/**
 * Quince segundos. Una peticion que tarda mas que esto, en una app donde cada
 * pantalla es una lista corta de movimientos, no va a llegar.
 */
export const REQUEST_TIMEOUT_MS = 15_000;

/**
 * Une el plazo de la peticion con la cancelacion que ya traiga quien llama.
 *
 * Las dos tienen que seguir distinguiendose: cancelar es lo que hace un cambio
 * de mes, y se ignora en silencio; agotar el plazo es un fallo que hay que
 * contar. En navegadores sin `AbortSignal.any` se conserva la cancelacion, que
 * es la que evita pintar datos del mes que la persona dejo atras.
 */
function withDeadline(signal: AbortSignal | null | undefined, timeoutMs: number) {
  if (typeof AbortSignal.timeout !== "function") return signal ?? undefined;
  const deadline = AbortSignal.timeout(timeoutMs);
  if (!signal) return deadline;
  if (typeof AbortSignal.any !== "function") return signal;
  return AbortSignal.any([signal, deadline]);
}

export async function apiFetch(
  accessToken: string | null | undefined,
  input: RequestInfo | URL,
  init: RequestInit & { timeoutMs?: number } = {}
): Promise<Response> {
  if (!accessToken) throw new Error("Necesitas iniciar sesión.");
  const { timeoutMs = REQUEST_TIMEOUT_MS, signal, ...rest } = init;
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  try {
    return await fetch(resolveApiUrl(input), {
      ...rest,
      headers,
      signal: withDeadline(signal, timeoutMs)
    });
  } catch (reason: unknown) {
    // El plazo agotado llega como TimeoutError, en ingles y hablando de
    // senales. Quien lee la pantalla necesita saber que fue el servidor.
    if (reason instanceof DOMException && reason.name === "TimeoutError") {
      throw new Error(SERVER_UNREACHABLE);
    }
    throw reason;
  }
}
