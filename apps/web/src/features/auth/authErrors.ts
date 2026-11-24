import { SERVER_UNREACHABLE, SESSION_EXPIRED, UNEXPECTED } from "../../lib/messages";

/** Un fetch que revienta llega como TypeError; Supabase lo envuelve con su propio nombre. */
function isUnreachable(error: Error): boolean {
  return (
    error instanceof TypeError ||
    error.name === "AuthRetryableFetchError" ||
    /failed to fetch|network request failed|networkerror/i.test(error.message)
  );
}

/**
 * El estado del servicio, cuando Supabase lo adjunta al error.
 *
 * Un proyecto pausado por inactividad no deja la peticion sin respuesta: la
 * responde, con un error de servicio en ingles. Eso llegaba a la pantalla tal
 * cual, y mandaba a buscar el fallo donde no estaba.
 */
function serverStatus(error: Error): number | undefined {
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" ? status : undefined;
}

/**
 * Traduce un fallo de autenticacion a lo que la persona necesita leer.
 *
 * La distincion que importa es entre "lo que escribiste no sirve" y "el
 * servidor no esta ahi": culpar a la contrasena cuando el servicio esta caido
 * manda a la gente a cambiarla, y a su dueno a buscar donde no es.
 */
export function describeAuthError(error: unknown): string {
  if (!(error instanceof Error)) return UNEXPECTED;
  if (isUnreachable(error)) return SERVER_UNREACHABLE;
  const status = serverStatus(error);
  if (status === 0 || (status !== undefined && status >= 500)) return SERVER_UNREACHABLE;
  if (/jwt|expired|session.*(expired|missing)/i.test(error.message)) return SESSION_EXPIRED;
  return error.message || UNEXPECTED;
}
