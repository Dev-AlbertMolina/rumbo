import { formatDop, type Movement, type MovementStatus, type MovementType } from "@ahorra/domain";
import {
  m,
  useDragControls,
  useReducedMotion,
  type HTMLMotionProps,
  type PanInfo
} from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";
import { type FormEvent, useState } from "react";
import { MoneyInput } from "../../components/MoneyInput";
import { ReceiptField } from "../../components/ReceiptField";
import { toast } from "../../components/Toaster";
import { useDialog } from "../../hooks/useDialog";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { backdropMotion, DURATION, EASE_DRAWER, EASE_OUT } from "../../lib/motion";
import { expenseCategories, incomeCategories } from "../../lib/categories";
import { today } from "../../lib/format";
import { apiFetch } from "../../lib/api";
import { queueMovement } from "../../lib/offline/outbox";

export function MovementDialog({
  accessToken,
  userId,
  initialType,
  movement,
  expenseOptions,
  spaceId,
  availableCents,
  onClose,
  onSaved
}: {
  accessToken: string;
  userId: string;
  initialType: MovementType;
  movement?: Movement;
  expenseOptions: string[];
  spaceId: string;
  availableCents: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const dialogRef = useDialog<HTMLElement>(onClose);
  const phone = useMediaQuery("(max-width: 600px)");
  const reduceMotion = useReducedMotion();
  const dragControls = useDragControls();
  const [type, setType] = useState<MovementType>(initialType);
  const [status, setStatus] = useState<MovementStatus>(movement?.status ?? "REGISTERED");
  const [amount, setAmount] = useState(movement ? String(movement.amountCents / 100) : "");
  const [category, setCategory] = useState(
    movement?.category ?? (initialType === "INCOME" ? incomeCategories[0]! : expenseCategories[0]!)
  );
  const [description, setDescription] = useState(movement?.description ?? "");
  const [date, setDate] = useState(movement?.effectiveDate ?? today());
  const [receiptPath, setReceiptPath] = useState<string | null>(movement?.receiptPath ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amountCents = Math.round(Number(amount || 0) * 100);
  const previousImpact =
    movement?.status === "REGISTERED"
      ? movement.type === "INCOME"
        ? movement.amountCents
        : -movement.amountCents
      : 0;
  const nextImpact = status === "REGISTERED" ? (type === "INCOME" ? amountCents : -amountCents) : 0;
  const impact = availableCents - previousImpact + nextImpact;
  const categories = type === "INCOME" ? incomeCategories : expenseOptions;

  // En escritorio el panel entra desde la derecha. En el telefono ocupa la
  // pantalla y sube desde abajo, como las hojas del sistema, y se cierra
  // arrastrando la cabecera hacia abajo: basta un gesto rapido aunque sea
  // corto. El arrastre mueve el panel con `y`, asi que ahi no sirve el
  // transform escrito a mano del escritorio.
  const sheetMotion: HTMLMotionProps<"section"> = phone
    ? {
        initial: { y: "100%" },
        animate: { y: 0 },
        exit: { y: "100%", transition: { duration: DURATION.base, ease: EASE_OUT } },
        transition: { duration: DURATION.drawer, ease: EASE_DRAWER },
        drag: "y",
        dragListener: false,
        dragControls,
        dragConstraints: { top: 0, bottom: 0 },
        dragElastic: { top: 0, bottom: 0.8 },
        onDragEnd: (_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
          if (info.offset.y > 120 || info.velocity.y > 500) onClose();
        }
      }
    : {
        initial: { transform: reduceMotion ? "translateX(0%)" : "translateX(100%)" },
        animate: { transform: "translateX(0%)" },
        exit: {
          transform: reduceMotion ? "translateX(0%)" : "translateX(100%)",
          transition: { duration: DURATION.base, ease: EASE_OUT }
        },
        transition: { duration: DURATION.drawer, ease: EASE_DRAWER }
      };

  function changeType(next: MovementType) {
    setType(next);
    setCategory(next === "INCOME" ? incomeCategories[0]! : expenseOptions[0]!);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!Number.isFinite(amountCents) || amountCents <= 0) {
      setError("Introduce un monto mayor que cero.");
      return;
    }
    setSaving(true);
    setError("");

    const payload = {
      spaceId,
      type,
      status,
      amountCents,
      effectiveDate: date,
      description: description.trim() || category,
      category,
      receiptPath
    };

    try {
      const response = await apiFetch(
        accessToken,
        movement ? `/api/movements/${movement.id}` : "/api/movements",
        {
          method: movement ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) throw new Error("No pudimos guardar el movimiento.");
      toast(
        movement ? "Cambios guardados" : type === "INCOME" ? "Ingreso guardado" : "Gasto guardado"
      );
      onSaved();
    } catch (reason) {
      // Un fetch que revienta es falta de red; un 4xx habria devuelto una
      // respuesta. Solo lo primero se guarda para despues: un dato que el
      // servidor rechaza seguiria siendo invalido dentro de una hora.
      const offline = reason instanceof TypeError && !movement;
      if (offline) {
        await queueMovement(userId, payload);
        toast("Guardado sin conexión: se sube solo cuando vuelva la señal", "info");
        onSaved();
      } else {
        setError(reason instanceof Error ? reason.message : "No pudimos guardar el movimiento.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <m.div
      className="dialog-backdrop"
      role="presentation"
      {...backdropMotion}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <m.section
        ref={dialogRef}
        className="movement-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        {...sheetMotion}
      >
        <header onPointerDown={(event) => phone && dragControls.start(event)}>
          {/* El asa solo se ve en el telefono; la cabecera entera sirve para
              arrastrar, el asa solo lo anuncia. */}
          <div className="sheet-grip" aria-hidden="true">
            <span />
          </div>
          <div>
            <p className="eyebrow">{movement ? "Editar movimiento" : "Nuevo movimiento"}</p>
            <h2 id="dialog-title">
              {movement
                ? `Editar ${type === "INCOME" ? "ingreso" : "gasto"}`
                : type === "INCOME"
                  ? "Registrar ingreso"
                  : "Registrar gasto"}
            </h2>
          </div>
          <button className="close-button" aria-label="Cerrar" onClick={onClose}>
            ×
          </button>
        </header>
        <form onSubmit={submit}>
          <div className="type-tabs">
            <button
              type="button"
              className={type === "EXPENSE" ? "active" : ""}
              onClick={() => changeType("EXPENSE")}
            >
              <TrendingDown size={16} /> Gasto
            </button>
            <button
              type="button"
              className={type === "INCOME" ? "active" : ""}
              onClick={() => changeType("INCOME")}
            >
              <TrendingUp size={16} /> Ingreso
            </button>
          </div>
          <label>
            Monto <span>*</span>
            <div className="money-input">
              <span>RD$</span>
              <MoneyInput autoFocus value={amount} onChange={setAmount} placeholder="0.00" />
            </div>
          </label>
          <div className="form-row">
            <label>
              Categoría <span>*</span>
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                {categories.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Fecha <span>*</span>
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
          </div>
          <label>
            Descripción <small>Opcional</small>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={
                type === "INCOME" ? "Ej. sueldo de agosto" : "Ej. compra del supermercado"
              }
            />
          </label>
          <fieldset>
            <legend>Estado</legend>
            <label>
              <input
                type="radio"
                checked={status === "REGISTERED"}
                onChange={() => setStatus("REGISTERED")}
              />{" "}
              Registrado
            </label>
            <label>
              <input
                type="radio"
                checked={status === "SCHEDULED"}
                onChange={() => setStatus("SCHEDULED")}
              />{" "}
              Programado
            </label>
          </fieldset>
          {type === "EXPENSE" && (
            <ReceiptField userId={userId} value={receiptPath} onChange={setReceiptPath} />
          )}
          {amountCents > 0 && status === "REGISTERED" && (
            <div className="impact-card">
              <span>Disponible después de guardar</span>
              <strong>{formatDop(impact)}</strong>
            </div>
          )}
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={onClose}>
              Cancelar
            </button>
            <button className="primary" disabled={saving}>
              {saving
                ? "Guardando..."
                : movement
                  ? "Guardar cambios"
                  : `Guardar ${type === "INCOME" ? "ingreso" : "gasto"}`}
            </button>
          </div>
        </form>
      </m.section>
    </m.div>
  );
}
