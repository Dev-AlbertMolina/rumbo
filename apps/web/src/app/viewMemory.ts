/**
 * Donde estaba cada pestana: cuanto habia bajado y que filtros tenia puestos.
 *
 * Vive en memoria a proposito. No es persistencia: al recargar la app se
 * empieza limpio, que es lo que la gente espera. Lo que arregla es el viaje
 * corto, ir a mirar una cifra a otra seccion y volver, que antes costaba
 * rehacer el scroll y los filtros.
 */
const scrollByPath = new Map<string, number>();
const filtersByPath = new Map<string, unknown>();

export function rememberScroll(path: string, top: number): void {
  scrollByPath.set(path, Math.max(0, Math.round(top)));
}

export function recallScroll(path: string): number {
  return scrollByPath.get(path) ?? 0;
}

export function rememberFilters<T>(path: string, filters: T): void {
  filtersByPath.set(path, filters);
}

export function recallFilters<T>(path: string, fallback: T): T {
  return (filtersByPath.get(path) as T) ?? fallback;
}

/** Al cambiar de sesion lo recordado es de otra persona. */
export function forgetViews(): void {
  scrollByPath.clear();
  filtersByPath.clear();
}
