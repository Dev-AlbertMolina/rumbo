import { AnimatePresence, m, useReducedMotion, type PanInfo } from "framer-motion";
import { AlertTriangle, CircleCheck, CloudOff } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { DURATION, EASE_OUT } from "../lib/motion";

export type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

/** Lo que dura un aviso a la vista si nadie lo toca. */
const LIFETIME_MS = 4000;
/** Basta con arrastrarlo esto, o con un gesto rapido aunque sea corto. */
const SWIPE_DISTANCE = 80;
const SWIPE_VELOCITY = 500;

let items: ToastItem[] = [];
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  return items;
}

/**
 * Confirma algo que acaba de pasar, sin interrumpir.
 *
 * Una funcion suelta y no un hook: se llama desde donde se guarda, sin pasar
 * nada por props. Antes cada pantalla ponia su mensaje dentro de la pagina, y
 * si habias bajado no lo veias.
 */
export function toast(message: string, tone: ToastTone = "success") {
  // Tres a la vez como mucho: una rafaga de avisos tapa la pantalla y no se lee.
  items = [...items.slice(-2), { id: nextId++, message, tone }];
  emit();
}

export function dismissToast(id: number) {
  items = items.filter((item) => item.id !== id);
  emit();
}

const ICONS = {
  success: CircleCheck,
  error: AlertTriangle,
  info: CloudOff
};

/**
 * El aviso tal como se ve, sin animacion ni arrastre. Toast lo envuelve con
 * las dos cosas, y la vista previa de Novedades lo monta tal cual.
 */
export function ToastCard({ message, tone }: { message: string; tone: ToastTone }) {
  const Icon = ICONS[tone];
  return (
    <div className={`toast ${tone}`}>
      <Icon size={18} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}

/** Se monta una sola vez, en la raiz de la app. */
export function Toaster() {
  const toasts = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return (
    <div className="toaster" role="status" aria-live="polite">
      <AnimatePresence initial={false}>
        {toasts.map((item) => (
          <Toast key={item.id} item={item} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function Toast({ item }: { item: ToastItem }) {
  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(() => document.hidden);
  const [flung, setFlung] = useState(0);

  // Mientras no se puede leer, el reloj se detiene: con el cursor encima o con
  // la app en segundo plano. Al volver empieza de nuevo.
  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (hovered || hidden) return;
    const timer = setTimeout(() => dismissToast(item.id), LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [item.id, hovered, hidden]);

  function onDragEnd(_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    if (Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY) {
      setFlung(Math.sign(info.offset.x) || 1);
      dismissToast(item.id);
    }
  }

  // Dos capas: la de fuera entra y sale con transform (va por la GPU), y la de
  // dentro se arrastra con `x`. En la misma, el arrastre y el transform
  // escrito a mano se pisarian.
  return (
    <m.div
      className="toast-slot"
      initial={{
        opacity: 0,
        transform: reduceMotion ? "translateY(0%) scale(1)" : "translateY(100%) scale(1)"
      }}
      animate={{ opacity: 1, transform: "translateY(0%) scale(1)" }}
      exit={{
        opacity: 0,
        transform: reduceMotion || flung ? "translateY(0%) scale(1)" : "translateY(0%) scale(0.96)",
        transition: { duration: DURATION.fast, ease: EASE_OUT }
      }}
      transition={{ duration: DURATION.base, ease: EASE_OUT }}
    >
      <m.div
        drag="x"
        dragSnapToOrigin={!flung}
        dragElastic={0.7}
        animate={flung ? { x: flung * 420 } : undefined}
        transition={{ duration: DURATION.base, ease: EASE_OUT }}
        onDragEnd={onDragEnd}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
      >
        <ToastCard message={item.message} tone={item.tone} />
      </m.div>
    </m.div>
  );
}
