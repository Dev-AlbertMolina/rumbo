import { createPortal } from "react-dom";
import { m, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "./icons";
import { useDialog } from "../hooks/useDialog";
import { backdropMotion, popMotion } from "../lib/motion";

/**
 * Pide confirmacion antes de algo que no se puede deshacer.
 *
 * Quien lo usa lo monta dentro de `AnimatePresence`, asi tambien se anima al
 * cerrarse: sale mas rapido de lo que entra.
 *
 * Y se dibuja al final del documento, no donde se escribe. Las pantallas que
 * lo usan viven dentro del contenedor que se atenua cuando los datos son del
 * mes anterior, y la opacidad crea un contexto de apilado: dentro de el, el
 * dialogo se atenuaba con la pantalla y quedaba por debajo de la barra de
 * navegacion, que esta fuera. Un "esto no se puede deshacer" a media luz y
 * tapado es justo lo que no puede pasar.
 */
export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  danger = false,
  onConfirm,
  onCancel
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const dialogRef = useDialog<HTMLElement>(onCancel);
  const reduceMotion = useReducedMotion();

  return createPortal(
    <m.div
      className="dialog-backdrop confirm-backdrop"
      role="presentation"
      {...backdropMotion}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <m.section
        ref={dialogRef}
        className="confirm-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        {...popMotion(reduceMotion)}
      >
        {danger && (
          <span className="confirm-dialog-icon" aria-hidden="true">
            <AlertTriangle size={24} />
          </span>
        )}
        <h2 id="confirm-dialog-title">{title}</h2>
        <p>{description}</p>
        <div className="dialog-actions">
          <button type="button" className="secondary" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={danger ? "primary confirm-danger" : "primary"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </m.section>
    </m.div>,
    document.body
  );
}
