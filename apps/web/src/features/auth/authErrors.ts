const UNREACHABLE =
  "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo en un momento.";
const EXPIRED = "Tu sesión caducó. Vuelve a entrar.";
const UNKNOWN = "No pudimos completar la solicitud. Inténtalo de nuevo.";

/** Un fetch que revienta llega como TypeError; Supabase lo envuelve con su propio nombre. */
function isUnreachable(error: Error): boolean {
  return (
    error instanceof TypeError ||
    error.name === "AuthRetryableFetchError" ||
    /failed to fetch|network request failed|networkerror/i.test(error.message)
  );
}

/**
 * Traduce un fallo de autenticacion a lo que la persona necesita leer.
 *
 * La distincion que importa es entre "lo que escribiste no sirve" y "el
 * servidor no esta ahi": culpar a la contrasena cuando el servicio esta caido
 * manda a la gente a cambiarla, y a su dueno a buscar donde no es.
 */
export function describeAuthError(error: unknown): string {
  if (!(error instanceof Error)) return UNKNOWN;
  if (isUnreachable(error)) return UNREACHABLE;
  if (/jwt|expired|session.*(expired|missing)/i.test(error.message)) return EXPIRED;
  return error.message || UNKNOWN;
}
