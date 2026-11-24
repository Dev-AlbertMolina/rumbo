/**
 * El hueco que ocupa una pantalla mientras su codigo llega.
 *
 * Reutiliza el esqueleto que ya usa el inicio, a la altura de un panel, para
 * que la pagina no pegue un salto cuando el contenido real aparece. Sin
 * animacion propia: el esqueleto ya se detiene con "reducir movimiento".
 */
export function PageFallback() {
  return (
    <div className="page-fallback" aria-busy="true" aria-live="polite">
      <span className="sr-only">Cargando la sección</span>
      <span className="skeleton skeleton-page-title" />
      <span className="skeleton skeleton-page-panel" />
    </div>
  );
}
