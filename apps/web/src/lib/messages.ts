/**
 * Los mensajes que la persona lee cuando algo falla, en un solo sitio.
 *
 * Dan todos la misma informacion: de quien es el problema y que se puede hacer.
 * Vivian repetidos entre el login y las pantallas, y asi el login aprendio a
 * distinguir un servidor caido de una contrasena mal escrita mientras el resto
 * de la app seguia diciendo "no pudimos cargar la informacion" para todo.
 */
export const SERVER_UNREACHABLE =
  "No pudimos conectar con el servidor. Revisa tu conexión e inténtalo en un momento.";

export const SESSION_EXPIRED = "Tu sesión caducó. Vuelve a entrar.";

export const UNEXPECTED = "No pudimos completar la solicitud. Inténtalo de nuevo.";

export const LOAD_FAILED = "No pudimos cargar la información.";
