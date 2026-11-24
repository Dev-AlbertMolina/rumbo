import { pendingOperationCount } from "../../lib/offline/database";

/**
 * Lo que se perderia al cerrar sesion.
 *
 * Al salir se borra del aparato todo lo de esa persona, que es lo correcto en
 * un telefono prestado. El problema es lo que aun no ha llegado al servidor:
 * un gasto anotado sin conexion se va con el resto, en silencio. Esto cuenta
 * cuantos hay para poder avisar antes.
 */
export async function unsentBeforeSignOut(userId: string | undefined): Promise<number> {
  if (!userId) return 0;
  try {
    return await pendingOperationCount(userId);
  } catch {
    // Si la base local no responde, salir no puede quedarse bloqueado.
    return 0;
  }
}

/** El aviso, con la cuenta dentro. En plural o en singular, segun toque. */
export function unsentWarning(count: number): string {
  if (count === 1) {
    return "Tienes 1 movimiento sin enviar. Si sales ahora se pierde.";
  }
  return `Tienes ${count} movimientos sin enviar. Si sales ahora se pierden.`;
}
