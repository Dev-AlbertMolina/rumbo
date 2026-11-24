/** Lo que necesita saber del navegador, inyectable para poder probarlo. */
export interface ScrollEnvironment {
  viewportHeight: () => number;
  documentHeight: () => number;
  scrollTo: (top: number) => void;
  nextFrame: (callback: () => void) => void;
}

/** Hasta medio segundo a 60 fotogramas; si no llego, es que no va a llegar. */
const MAX_FRAMES = 30;

/**
 * Devuelve la pagina a donde estaba, en cuanto haya pagina donde hacerlo.
 *
 * Desde que cada pantalla se carga al entrar en ella, al navegar hay unos
 * fotogramas en los que solo existe el esqueleto: poner el scroll ahi no hace
 * nada, porque el documento todavia no es lo bastante alto. Asi que se espera,
 * fotograma a fotograma, a que el contenido ocupe su sitio.
 */
export function restoreScrollWhenReady(top: number, environment: ScrollEnvironment): void {
  if (top <= 0) {
    environment.scrollTo(0);
    return;
  }

  let framesLeft = MAX_FRAMES;

  const attempt = () => {
    if (environment.documentHeight() >= top + environment.viewportHeight()) {
      environment.scrollTo(top);
      return;
    }
    if (framesLeft-- <= 0) return;
    environment.nextFrame(attempt);
  };

  attempt();
}

/** El entorno de verdad, el del navegador. */
export function browserScroll(): ScrollEnvironment {
  return {
    viewportHeight: () => window.innerHeight,
    documentHeight: () => document.documentElement.scrollHeight,
    scrollTo: (top) => {
      document.documentElement.scrollTop = top;
      document.body.scrollTop = top;
    },
    nextFrame: (callback) => window.requestAnimationFrame(callback)
  };
}
