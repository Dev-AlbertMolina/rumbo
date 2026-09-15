import type { HTMLMotionProps } from "framer-motion";

/**
 * Curvas y tiempos de las animaciones hechas con Framer Motion.
 *
 * Son las mismas que usa el CSS (--ease-out): si cada componente eligiera las
 * suyas, la app se moveria con cinco ritmos distintos.
 */

/** Salida fuerte: arranca rapido, que es el momento que mas se mira. */
export const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1];
/** La curva de iOS para paneles que entran desde un borde. */
export const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1];

export const DURATION = {
  /** Menus, avisos y todas las salidas. */
  fast: 0.15,
  /** Dialogos centrados y bloques que se pliegan. */
  base: 0.2,
  /** Paneles que cruzan media pantalla. */
  drawer: 0.32
} as const;

/** Fondo oscurecido de los dialogos: solo fundido. */
export const backdropMotion: HTMLMotionProps<"div"> = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } },
  transition: { duration: DURATION.base, ease: EASE_OUT }
};

/**
 * Dialogo centrado: crece un poco desde su centro y sale mas rapido de lo que
 * entra, para que cerrar se sienta inmediato.
 *
 * Anima `transform` escrito como texto y no `scale`: asi la animacion va por
 * la GPU y no se entrecorta si la app esta cargando datos a la vez. Por eso
 * "reducir movimiento" se mira a mano, porque Framer lo aplica a `scale`, `x`
 * y compania, no a un transform escrito a mano.
 */
export function popMotion(reduceMotion: boolean | null): HTMLMotionProps<"section"> {
  const rest = "scale(1)";
  return {
    initial: { opacity: 0, transform: reduceMotion ? rest : "scale(0.96)" },
    animate: { opacity: 1, transform: rest },
    exit: {
      opacity: 0,
      transform: reduceMotion ? rest : "scale(0.97)",
      transition: { duration: DURATION.fast, ease: EASE_OUT }
    },
    transition: { duration: DURATION.base, ease: EASE_OUT }
  };
}

/**
 * Bloque que se pliega: anima su alto hasta el del contenido. Es de las pocas
 * animaciones que no pueden ir solo con transform, porque lo que cambia es
 * cuanto espacio ocupa; por eso se reserva para algo que se abre de vez en
 * cuando, nunca para lo que se repite a cada rato.
 */
export const collapseMotion: HTMLMotionProps<"div"> = {
  initial: { height: 0, opacity: 0 },
  animate: { height: "auto", opacity: 1 },
  exit: { height: 0, opacity: 0, transition: { duration: DURATION.fast, ease: EASE_OUT } },
  transition: { duration: DURATION.base, ease: EASE_OUT }
};
