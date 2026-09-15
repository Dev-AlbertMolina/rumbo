import { m, useReducedMotion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useDialog } from "../hooks/useDialog";
import { backdropMotion, popMotion } from "../lib/motion";

/**
 * Pide confirmacion antes de algo que no se puede deshacer.
 *
 * Quien lo usa lo monta dentro de `AnimatePresence`, asi tambien se anima al
 * cerrarse: sale mas rapido de lo que entra.
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

  return (
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
            <AlertTriangle size={20} />
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
    </m.div>
  );
}
