import { useEffect, useRef, useState } from "react";

/**
 * Ancho real de un elemento, al dia cuando cambia.
 *
 * Los graficos se dibujan a su tamano verdadero en vez de estirar un viewBox
 * fijo: estirado, el texto de los ejes crece o se encoge con la pantalla y en
 * un telefono queda ilegible.
 */
export function useElementWidth<T extends HTMLElement>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.round(entry.contentRect.width));
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, width] as const;
}
