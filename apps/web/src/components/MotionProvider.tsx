import { LazyMotion, MotionConfig } from "framer-motion";
import type { ReactNode } from "react";

const loadFeatures = () => import("../lib/motionFeatures").then((module) => module.default);

/**
 * Framer Motion para toda la app.
 *
 * `LazyMotion` con `strict` obliga a usar `m` en lugar de `motion`, que
 * arrastraria la libreria entera al primer bundle; las funciones llegan en un
 * trozo aparte en cuanto la app arranca.
 *
 * `reducedMotion="user"` respeta el ajuste del telefono: con "reducir
 * movimiento" activo quita desplazamientos y escalas, y deja los fundidos.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
