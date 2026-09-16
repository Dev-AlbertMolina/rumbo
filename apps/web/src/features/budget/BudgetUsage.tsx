import { formatDop, type BudgetCategoryAlert } from "@ahorra/domain";
import { AlertTriangle, Gauge } from "lucide-react";
import type { MonthElapsed } from "../../lib/format";

/**
 * Cuanto se lleva gastado de un limite, y si va mas rapido que el mes.
 *
 * La barra sola decia cuanto se llevaba, no si era mucho: un 60% es poco el
 * dia 28 y demasiado el dia 5. La marca pone el punto del mes encima de la
 * barra, para verlo sin hacer la cuenta.
 */
export function BudgetUsage({
  spent,
  limit,
  level,
  elapsed
}: {
  spent: number;
  limit: number;
  level?: BudgetCategoryAlert["level"];
  elapsed: Pick<MonthElapsed, "ratio" | "current">;
}) {
  const percent = Math.round((spent / limit) * 100);
  const remaining = limit - spent;
  const monthPercent = Math.round(elapsed.ratio * 100);
  // Diez puntos de margen: un gasto grande al principio, como la compra del
  // mes, no deberia bastar para dar la alarma. Si ya hay aviso de limite, manda
  // ese.
  const ahead = elapsed.current && percent <= 100 && percent - monthPercent > 10;

  return (
    <>
      <div className="budget-progress">
        <span
          style={{ width: `${Math.min(percent, 100)}%` }}
          className={percent > 100 ? "over" : ahead ? "ahead" : ""}
        />
        {elapsed.current && (
          <i className="budget-pace" style={{ left: `${monthPercent}%` }} aria-hidden="true" />
        )}
      </div>
      <div className="budget-status">
        <span>
          {formatDop(spent)} de {formatDop(limit)}
        </span>
        <strong className={remaining < 0 ? "danger-text" : ""}>
          {remaining >= 0
            ? `${formatDop(remaining)} disponibles`
            : `Excedido por ${formatDop(Math.abs(remaining))}`}
        </strong>
      </div>
      {level === "OVER" ? (
        <p className="budget-flag over">
          <AlertTriangle size={14} aria-hidden="true" /> Te pasaste del límite
        </p>
      ) : level === "NEAR" ? (
        <p className="budget-flag near">
          <AlertTriangle size={14} aria-hidden="true" /> Ya usaste el {percent}% del límite
        </p>
      ) : ahead ? (
        <p className="budget-flag pace">
          <Gauge size={14} aria-hidden="true" /> Vas adelantado: llevas el {percent}% con el{" "}
          {monthPercent}% del mes
        </p>
      ) : null}
    </>
  );
}
