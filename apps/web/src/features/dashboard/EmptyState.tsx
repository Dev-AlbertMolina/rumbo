import { IllustratedEmptyState } from "../../components/IllustratedEmptyState";

export function EmptyState({
  onIncome,
  onExpense
}: {
  onIncome: () => void;
  onExpense: () => void;
}) {
  return (
    <IllustratedEmptyState
      eyebrow="Comienza con lo esencial"
      title="Todavía no podemos calcular tu disponible"
      description="Registra tu sueldo o primer ingreso y luego añade tus gastos. Verás cómo cambia el dinero que te queda."
      action={
        <>
          <button className="primary" onClick={onIncome}>
            Registrar ingreso
          </button>
          <button className="secondary" onClick={onExpense}>
            Registrar gasto
          </button>
        </>
      }
    />
  );
}
