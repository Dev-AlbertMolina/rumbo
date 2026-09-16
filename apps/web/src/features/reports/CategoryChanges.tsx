import { formatDop, type Summary } from "@ahorra/domain";
import { monthName, previousMonth } from "../../lib/format";

const MAX_ROWS = 6;

/**
 * ¿Que cambio este mes? Categoria por categoria, frente al mes anterior.
 *
 * Reportes repetia los graficos del inicio; esto es lo que un reporte puede
 * decir y el inicio no: hacia donde se movio el gasto. Barras a la derecha
 * para lo que subio y a la izquierda para lo que bajo, ordenadas por cuanto
 * cambiaron, que es lo que se busca.
 */
export function CategoryChanges({
  summary,
  previousSummary,
  month
}: {
  summary: Summary;
  previousSummary: Summary | null;
  month: string;
}) {
  const previousName = monthName(previousMonth(month));

  if (!previousSummary) {
    return (
      <section className="panel category-changes">
        <header>
          <div>
            <p className="eyebrow">Frente a {previousName}</p>
            <h2>¿Qué cambió este mes?</h2>
          </div>
        </header>
        <p className="muted">
          Cuando haya datos de {previousName}, aquí verás qué categorías subieron y cuáles bajaron.
        </p>
      </section>
    );
  }

  const before = new Map(
    previousSummary.expenseByCategory.map((item) => [item.category, item.amountCents])
  );
  const now = new Map(summary.expenseByCategory.map((item) => [item.category, item.amountCents]));
  const changes = [...new Set([...before.keys(), ...now.keys()])]
    .map((category) => ({
      category,
      delta: (now.get(category) ?? 0) - (before.get(category) ?? 0)
    }))
    .filter((change) => change.delta !== 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const shown = changes.slice(0, MAX_ROWS);
  const scale = Math.max(1, ...shown.map((change) => Math.abs(change.delta)));
  const total = summary.expenseCents - previousSummary.expenseCents;
  const top = shown[0];

  const title =
    total > 0
      ? `Gastaste ${formatDop(total)} más que en ${previousName}`
      : total < 0
        ? `Gastaste ${formatDop(-total)} menos que en ${previousName}`
        : `Gastaste lo mismo que en ${previousName}`;

  return (
    <section className="panel category-changes">
      <header>
        <div>
          <p className="eyebrow">Frente a {previousName}</p>
          <h2>{title}</h2>
          {top && (
            <p className="category-changes-detail">
              {top.delta > 0
                ? `Lo que más subió: ${top.category}, ${formatDop(top.delta)} más.`
                : `Lo que más bajó: ${top.category}, ${formatDop(-top.delta)} menos.`}
            </p>
          )}
        </div>
      </header>

      {shown.length === 0 ? (
        <p className="muted">Cada categoría quedó igual.</p>
      ) : (
        <>
          <div className="changes-scale" aria-hidden="true">
            <span />
            <span className="changes-scale-labels">
              <span>Bajó</span>
              <span>Subió</span>
            </span>
            <span />
          </div>
          <ul className="changes-list">
            {shown.map(({ category, delta }) => (
              <li key={category} className={delta > 0 ? "up" : "down"}>
                <span className="changes-label">{category}</span>
                <span className="changes-track" aria-hidden="true">
                  <span style={{ width: `${(Math.abs(delta) / scale) * 50}%` }} />
                </span>
                <strong className="changes-value">
                  {delta > 0 ? "+" : "−"}
                  {formatDop(Math.abs(delta))}
                </strong>
              </li>
            ))}
          </ul>
          {changes.length > MAX_ROWS && (
            <p className="muted changes-more">
              Y {changes.length - MAX_ROWS} categorías más con cambios más pequeños.
            </p>
          )}
        </>
      )}
    </section>
  );
}
