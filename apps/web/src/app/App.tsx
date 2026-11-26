import { formatDop, type MovementType, type Movement } from "@ahorra/domain";
import { AnimatePresence } from "framer-motion";
import { AlertTriangle, Plus } from "../components/icons";
import { lazy, Suspense, useState } from "react";
import { useAuth } from "../features/auth/AuthProvider";
import { BalanceBridge } from "../components/BalanceBridge";
import { BottomNav } from "../components/layout/BottomNav";
import { RumboLogo } from "../components/layout/RumboLogo";
import { Sidebar } from "../components/layout/Sidebar";
import { UserMenu } from "../components/layout/UserMenu";
import { CategoryChart } from "../features/dashboard/CategoryChart";
import { BalanceCard } from "../features/dashboard/BalanceCard";
import { EmptyState } from "../features/dashboard/EmptyState";
import { MonthBalanceChart } from "../features/dashboard/MonthBalanceChart";
import { RecentMovements } from "../features/dashboard/RecentMovements";
import { MovementDialog } from "../features/movements/MovementDialog";
const MovementsPage = lazy(() =>
  import("../features/movements/MovementsPage").then((m) => ({ default: m.MovementsPage }))
);
import { RecurrencesPanel } from "../features/movements/RecurrencesPanel";
import { BudgetAlertBanner } from "../features/budget/BudgetAlertBanner";
const BudgetPage = lazy(() =>
  import("../features/budget/BudgetPage").then((m) => ({ default: m.BudgetPage }))
);
const DebtsPage = lazy(() =>
  import("../features/debts/DebtsPage").then((m) => ({ default: m.DebtsPage }))
);
const GoalsPage = lazy(() =>
  import("../features/goals/GoalsPage").then((m) => ({ default: m.GoalsPage }))
);
const ReportsPage = lazy(() =>
  import("../features/reports/ReportsPage").then((m) => ({ default: m.ReportsPage }))
);
const SettingsPage = lazy(() =>
  import("../features/settings/SettingsPage").then((m) => ({ default: m.SettingsPage }))
);
const WhatsNewPage = lazy(() =>
  import("../features/whatsnew/WhatsNewPage").then((m) => ({ default: m.WhatsNewPage }))
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((m) => ({ default: m.NotFoundPage }))
);
import { useSpaces } from "../hooks/useSpaces";
import { useMonthlyData } from "../hooks/useMonthlyData";
import { useModuleData } from "../hooks/useModuleData";
import { useBalance } from "../hooks/useBalance";
import { useCountUp } from "../hooks/useCountUp";
import { useWhatsNew } from "../hooks/useWhatsNew";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { useReminder } from "../hooks/useReminder";
import { WhatsNewPanel } from "../components/WhatsNewPanel";
import { OfflineBanner } from "../components/OfflineBanner";
import { ChunkBoundary } from "../components/ChunkBoundary";
import { MotionProvider } from "../components/MotionProvider";
import { StaleNotice } from "./StaleNotice";
import { MonthAnswer } from "../features/dashboard/MonthAnswer";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { unsentBeforeSignOut, unsentWarning } from "../features/auth/signOutGuard";
import { PageFallback } from "../components/PageFallback";
import { Toaster } from "../components/Toaster";
import { expenseCategories } from "../lib/categories";
import { currentMonth, today } from "../lib/format";
import { navigate, usePathname } from "./router";

export default function App() {
  const auth = useAuth();
  const accessToken = auth.session?.access_token;
  const pathname = usePathname();
  const [month, setMonth] = useState(currentMonth());
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<MovementType>("EXPENSE");
  const [editingMovement, setEditingMovement] = useState<Movement | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  // Cuantos movimientos sin enviar se perderian al salir. Null = aun no se ha
  // preguntado; cerrar sesion pregunta primero y solo avisa si hay algo.
  const [unsentOnExit, setUnsentOnExit] = useState<number | null>(null);

  const { spaces, spaceId, setSpaceId, error: spacesError } = useSpaces(accessToken, auth.user?.id);
  const {
    summary,
    movements,
    loading,
    stale,
    error: monthlyError
  } = useMonthlyData(accessToken, spaceId, month, refreshKey, auth.user?.id);
  const {
    budgetLimits,
    goals,
    customCategories,
    recurrences,
    debts,
    error: moduleError
  } = useModuleData(accessToken, spaceId, month, refreshKey, auth.user?.id);

  const error = spacesError || monthlyError || moduleError;
  const { balance } = useBalance(accessToken, spaceId, refreshKey, auth.user?.id);
  const animatedAvailable = useCountUp(summary.availableAfterSavingsCents);
  const whatsNew = useWhatsNew(auth.user);
  const offline = useOfflineSync(auth.user?.id, accessToken, () =>
    setRefreshKey((value) => value + 1)
  );
  const reminder = useReminder(auth.user?.id, offline.pending);

  function openForm(type: MovementType) {
    setFormType(type);
    setEditingMovement(null);
    setFormOpen(true);
  }

  function editMovement(movement: Movement) {
    setFormType(movement.type);
    setEditingMovement(movement);
    setFormOpen(true);
  }

  if (!accessToken) {
    return (
      <main className="auth-setup-error">
        <h1>Necesitas iniciar sesión</h1>
        <p>No se cargaron datos financieros sin una sesión válida.</p>
      </main>
    );
  }

  /**
   * Salir borra del aparato lo de esta persona, que es lo correcto en un
   * telefono que se presta. Lo que no puede es llevarse en silencio un gasto
   * que aun no ha llegado al servidor.
   */
  async function requestSignOut() {
    const unsent = await unsentBeforeSignOut(auth.user?.id);
    if (unsent > 0) {
      setUnsentOnExit(unsent);
      return;
    }
    await auth.signOut();
  }

  return (
    <MotionProvider>
      <div className="app-shell">
        <a className="skip-link" href="#main">
          Saltar al contenido
        </a>
        <Sidebar
          pathname={pathname}
          user={auth.user}
          onSignOut={() => void requestSignOut()}
          onAdd={() => openForm("EXPENSE")}
        />

        <main id="main" className="main-content">
          <header className="topbar">
            <div className="topbar-header-row">
              <div className="topbar-brand">
                <RumboLogo size={48} />
              </div>
              {/* UserMenu visible only on mobile in the topbar */}
              {auth.user && (
                <UserMenu
                  user={auth.user}
                  onSignOut={() => void requestSignOut()}
                  className="topbar-user-menu"
                />
              )}
            </div>
            <div className="topbar-pickers">
              <label className="space-picker">
                <span>Espacio</span>
                <select value={spaceId} onChange={(event) => setSpaceId(event.target.value)}>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="month-picker">
                <span>Periodo</span>
                <input
                  type="month"
                  value={month}
                  min={auth.user?.created_at ? auth.user.created_at.substring(0, 7) : undefined}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </label>
            </div>
          </header>

          {stale && <StaleNotice />}
          <div
            key={pathname}
            className={`page-transition${stale ? " is-stale" : ""}`}
            aria-busy={stale}
          >
            <ChunkBoundary>
              <Suspense fallback={<PageFallback />}>
                {pathname === "/" || pathname === "/inicio" ? (
                  <>
                    <section className="hero" aria-labelledby="available-title">
                      <div>
                        {loading && !stale ? (
                          <>
                            <p className="eyebrow">Disponible después de ahorro</p>
                            <h1 id="available-title">
                              <span
                                className="skeleton skeleton-hero-number"
                                aria-label="Calculando"
                              />
                            </h1>
                          </>
                        ) : (
                          <MonthAnswer
                            month={month}
                            today={today()}
                            movements={movements}
                            availableCents={animatedAvailable}
                          />
                        )}
                        {(!loading || stale) && (
                          <BalanceBridge
                            beforeSavingsCents={summary.availableBeforeSavingsCents}
                            contributionCents={summary.contributionCents}
                            afterSavingsCents={summary.availableAfterSavingsCents}
                          />
                        )}
                      </div>
                    </section>

                    {/* Lo que entro, salio y apartaste deja de ser tres tarjetas
                        dentro del hero compitiendo con la respuesta: son tres
                        lineas, que es lo que son. */}
                    {(!loading || stale) && (
                      <div className="month-rows">
                        <div className="month-row">
                          <span>Entró este mes</span>
                          <b className="in">{formatDop(summary.incomeCents)}</b>
                        </div>
                        <div className="month-row">
                          <span>Salió</span>
                          <b className="out">{formatDop(summary.expenseCents)}</b>
                        </div>
                        <div className="month-row">
                          <span>Apartado para metas</span>
                          <b>{formatDop(summary.contributionCents)}</b>
                        </div>
                      </div>
                    )}

                    {(!loading || stale) && summary.availableAfterSavingsCents < 0 && (
                      <section className="allocation-alert" role="status">
                        <div>
                          <span aria-hidden="true">!</span>
                          <div>
                            <strong>
                              Tu plan supera el dinero disponible por{" "}
                              {formatDop(Math.abs(summary.availableAfterSavingsCents))}
                            </strong>
                            <p>
                              Después de los gastos quedaban{" "}
                              {formatDop(summary.availableBeforeSavingsCents)}, pero separaste{" "}
                              {formatDop(summary.contributionCents)} para ahorro. Ajusta gastos o el
                              aporte de este periodo.
                            </p>
                          </div>
                        </div>
                        <div className="button-row">
                          <button className="secondary" onClick={() => navigate("/movimientos")}>
                            Revisar gastos
                          </button>
                          <button className="primary" onClick={() => navigate("/metas")}>
                            Ajustar metas
                          </button>
                        </div>
                      </section>
                    )}

                    <OfflineBanner
                      online={offline.online}
                      pending={offline.pending}
                      onSync={() => void offline.sync()}
                    />

                    {(!loading || stale) && <BalanceCard balance={balance} />}

                    {(!loading || stale) && (
                      <BudgetAlertBanner limits={budgetLimits} summary={summary} />
                    )}

                    {error && (
                      <div className="error-banner" role="alert">
                        <AlertTriangle size={18} aria-hidden="true" />
                        <span>{error}</span>
                        <button onClick={() => setRefreshKey((value) => value + 1)}>
                          Reintentar
                        </button>
                      </div>
                    )}

                    {!loading && movements.length === 0 ? (
                      <EmptyState
                        onIncome={() => openForm("INCOME")}
                        onExpense={() => openForm("EXPENSE")}
                      />
                    ) : (
                      <div className="dashboard-grid">
                        <MonthBalanceChart movements={movements} month={month} />
                        <RecentMovements
                          movements={movements}
                          onEdit={editMovement}
                          onViewAll={() => navigate("/movimientos")}
                        />
                        <CategoryChart summary={summary} />
                      </div>
                    )}
                  </>
                ) : pathname === "/movimientos" ? (
                  <MovementsPage
                    movements={movements}
                    onAdd={openForm}
                    onEdit={editMovement}
                    minDate={
                      auth.user?.created_at ? auth.user.created_at.substring(0, 10) : undefined
                    }
                    recurrencesSlot={
                      <RecurrencesPanel
                        accessToken={accessToken}
                        spaceId={spaceId}
                        recurrences={recurrences}
                        customCategories={customCategories}
                        goals={goals}
                        onSaved={() => setRefreshKey((value) => value + 1)}
                      />
                    }
                  />
                ) : pathname === "/presupuesto" ? (
                  <BudgetPage
                    accessToken={accessToken}
                    spaceId={spaceId}
                    month={month}
                    summary={summary}
                    limits={budgetLimits}
                    customCategories={customCategories}
                    onSaved={() => setRefreshKey((value) => value + 1)}
                  />
                ) : pathname === "/metas" ? (
                  <GoalsPage
                    accessToken={accessToken}
                    spaceId={spaceId}
                    goals={goals}
                    onSaved={() => setRefreshKey((value) => value + 1)}
                  />
                ) : pathname === "/deudas" ? (
                  <DebtsPage
                    accessToken={accessToken}
                    spaceId={spaceId}
                    debts={debts}
                    onSaved={() => setRefreshKey((value) => value + 1)}
                  />
                ) : pathname === "/novedades" ? (
                  <WhatsNewPage />
                ) : pathname === "/reportes" ? (
                  <ReportsPage
                    summary={summary}
                    movements={movements}
                    month={month}
                    accessToken={accessToken}
                    spaceId={spaceId}
                  />
                ) : pathname === "/configuracion" ? (
                  <SettingsPage
                    accessToken={accessToken}
                    spaces={spaces}
                    spaceId={spaceId}
                    balance={balance}
                    reminder={reminder.settings}
                    onReminderChange={reminder.save}
                    user={auth.user}
                    onSaved={() => setRefreshKey((value) => value + 1)}
                  />
                ) : (
                  <NotFoundPage />
                )}
              </Suspense>
            </ChunkBoundary>
          </div>
        </main>

        <button
          className="floating-add"
          aria-label="Agregar movimiento"
          onClick={() => openForm("EXPENSE")}
        >
          <Plus size={24} />
        </button>
        <BottomNav pathname={pathname} />

        <AnimatePresence>
          {formOpen && (
            <MovementDialog
              key="movement-dialog"
              accessToken={accessToken}
              userId={auth.user?.id ?? ""}
              initialType={formType}
              movement={editingMovement ?? undefined}
              expenseOptions={[
                ...new Set([
                  ...expenseCategories,
                  ...customCategories.map((category) => category.name)
                ])
              ]}
              spaceId={spaceId}
              availableCents={summary.availableAfterSavingsCents}
              onClose={() => setFormOpen(false)}
              onSaved={() => {
                setFormOpen(false);
                setRefreshKey((value) => value + 1);
              }}
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {whatsNew.show && <WhatsNewPanel key="whats-new" onClose={whatsNew.dismiss} />}
        </AnimatePresence>
        <AnimatePresence>
          {unsentOnExit !== null && (
            <ConfirmDialog
              key="unsent-on-exit"
              title="Hay cosas sin enviar"
              description={unsentWarning(unsentOnExit)}
              confirmLabel="Salir igual"
              cancelLabel="Quedarme"
              danger
              onConfirm={() => {
                setUnsentOnExit(null);
                void auth.signOut();
              }}
              onCancel={() => setUnsentOnExit(null)}
            />
          )}
        </AnimatePresence>
        <Toaster />
      </div>
    </MotionProvider>
  );
}
