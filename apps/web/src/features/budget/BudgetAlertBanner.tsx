import { calculateBudgetAlerts, formatDop, type BudgetLimit, type Summary } from "@ahorra/domain";
import { AlertTriangle } from "lucide-react";
import { navigate } from "../../app/router";

/**
 * Avisa en el inicio de las categorias que se estan pasando del limite.
 *
 * El presupuesto solo cambia algo si se ve antes de gastar, no al entrar a
 * revisarlo. Por eso el aviso vive aqui y no solo en la pantalla de
 * presupuesto, y nombra las categorias concretas: "revisa tu presupuesto" no
 * le dice a nadie que hacer.
 */
export function BudgetAlertBanner({
  limits,
  summary
}: {
  limits: BudgetLimit[];
  summary: Summary;
}) {
  const alerts = calculateBudgetAlerts(limits, summary.expenseByCategory);
  const flagged = alerts.categories.filter((item) => item.level !== "OK");

  if (flagged.length === 0) return null;

  const over = alerts.overCount > 0;

  return (
    <section className={`budget-alert ${over ? "over" : "near"}`} role="status">
      <div>
        <span aria-hidden="true">
          <AlertTriangle size={18} />
        </span>
        <div>
          <strong>
            {over
              ? `Te pasaste del límite en ${alerts.overCount} ${alerts.overCount === 1 ? "categoría" : "categorías"}`
              : `Estás cerca del límite en ${alerts.nearCount} ${alerts.nearCount === 1 ? "categoría" : "categorías"}`}
          </strong>
          <ul className="budget-alert-list">
            {flagged.slice(0, 3).map((item) => (
              <li key={item.category}>
                <strong>{item.category}</strong>{" "}
                {item.level === "OVER"
                  ? `excedida por ${formatDop(Math.abs(item.remainingCents))}`
                  : `quedan ${formatDop(item.remainingCents)} de ${formatDop(item.limitCents)}`}
              </li>
            ))}
            {flagged.length > 3 && <li>y {flagged.length - 3} más</li>}
          </ul>
        </div>
      </div>
      <div className="button-row">
        <button className="secondary" onClick={() => navigate("/presupuesto")}>
          Ver presupuesto
        </button>
      </div>
    </section>
  );
}
