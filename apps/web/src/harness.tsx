// Banco de pruebas TEMPORAL para auditar graficos y movimiento. No se sube.
import "@fontsource/atkinson-hyperlegible/latin-400.css";
import "@fontsource/atkinson-hyperlegible/latin-700.css";
import "@fontsource/fraunces/latin-600.css";
import { AnimatePresence } from "framer-motion";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConfirmDialog } from "./components/ConfirmDialog";
import { MotionProvider } from "./components/MotionProvider";
import { Toaster, toast } from "./components/Toaster";
import { UserMenu } from "./components/layout/UserMenu";
import { MovementDialog } from "./features/movements/MovementDialog";
import {
  BalancePreview,
  BudgetAlertPreview,
  BudgetPacePreview,
  CategoryChangesPreview,
  DebtsModulePreview,
  GoalPacePreview,
  MonthBalancePreview,
  RecurrencePreview,
  SanPreview
} from "./features/whatsnew/previews";
import { CategoryChart } from "./features/dashboard/CategoryChart";
import { CashFlowChart } from "./features/dashboard/CashFlowChart";
import { calculateSummary, type Movement } from "@ahorra/domain";
import { today } from "./lib/format";
import "./styles.css";

const gasto = (id: string, category: string, amountCents: number): Movement => ({
  id,
  spaceId: "demo",
  type: "EXPENSE",
  status: "REGISTERED",
  amountCents,
  effectiveDate: today(),
  description: category,
  category,
  createdAt: `${today()}T12:00:00.000Z`
});

const resumen = calculateSummary([
  { ...gasto("i1", "Salario", 65_000_00), type: "INCOME" },
  gasto("e1", "Vivienda", 25_000_00),
  gasto("e2", "Alimentacion", 12_300_00),
  gasto("e3", "Transporte", 4_200_00),
  gasto("e4", "Salud", 2_100_00),
  gasto("e5", "Salidas", 3_900_00),
  gasto("e6", "Servicios", 2_800_00),
  gasto("e7", "Educacion", 1_400_00),
  { ...gasto("c1", "Ahorro", 8_000_00), type: "CONTRIBUTION" }
]);

function Harness() {
  const [sheet, setSheet] = useState(false);
  const [confirm, setConfirm] = useState(false);

  return (
    <MotionProvider>
      <main className="main-content" style={{ marginLeft: 0 }}>
        <div className="button-row" style={{ justifyContent: "space-between" }}>
          <div className="button-row" style={{ marginTop: 0 }}>
            <button id="open-sheet" className="primary" onClick={() => setSheet(true)}>
              Abrir movimiento
            </button>
            <button id="open-confirm" className="secondary" onClick={() => setConfirm(true)}>
              Confirmación
            </button>
            <button id="toast-ok" className="secondary" onClick={() => toast("Gasto guardado")}>
              Aviso
            </button>
          </div>
          <UserMenu user={{ email: "demo@example.com" }} onSignOut={() => undefined} />
        </div>

        <section id="month" className="dashboard-grid">
          <MonthBalancePreview />
        </section>
        <section id="dash" className="dashboard-grid">
          <CashFlowChart summary={resumen} previousSummary={null} />
          <CategoryChart summary={resumen} />
        </section>
        <section id="pace" style={{ marginTop: 20 }}>
          <BudgetPacePreview />
        </section>
        <section id="changes" className="reports-grid" style={{ marginTop: 20 }}>
          <CategoryChangesPreview />
        </section>
        <section id="goal" style={{ marginTop: 20 }}>
          <GoalPacePreview />
        </section>
        <section id="san" style={{ marginTop: 20 }}>
          <SanPreview />
        </section>
        <section id="balance" style={{ marginTop: 20 }}>
          <BalancePreview />
        </section>
        <section id="alert" style={{ marginTop: 20 }}>
          <BudgetAlertPreview />
        </section>
        <section id="recurrences" style={{ marginTop: 20 }}>
          <RecurrencePreview />
        </section>
        <section id="debts" style={{ marginTop: 20 }}>
          <DebtsModulePreview />
        </section>
      </main>

      <AnimatePresence>
        {sheet && (
          <MovementDialog
            key="sheet"
            accessToken=""
            userId=""
            initialType="EXPENSE"
            expenseOptions={["Alimentacion", "Transporte"]}
            spaceId="demo"
            availableCents={100_000}
            onClose={() => setSheet(false)}
            onSaved={() => setSheet(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {confirm && (
          <ConfirmDialog
            key="confirm"
            title="Eliminar compromiso"
            description="¿Eliminar esto? Los movimientos se quedan como están."
            confirmLabel="Eliminar"
            danger
            onCancel={() => setConfirm(false)}
            onConfirm={() => setConfirm(false)}
          />
        )}
      </AnimatePresence>
      <Toaster />
    </MotionProvider>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Harness />
  </StrictMode>
);
