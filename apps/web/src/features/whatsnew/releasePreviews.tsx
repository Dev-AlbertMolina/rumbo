import type { ComponentType } from "react";
import {
  BalancePreview,
  BudgetAlertPreview,
  BudgetPacePreview,
  CategoryChangesPreview,
  DebtKindPickerPreview,
  DebtsModulePreview,
  GoalPacePreview,
  MonthBalancePreview,
  MovementsMobilePreview,
  OfflinePreview,
  ReceiptPreview,
  RecurrencePreview,
  ReminderPreview,
  SanPreview,
  ServiceErrorPreview,
  ToastPreview
} from "./previews";

/**
 * Las vistas previas de Novedades, por titulo de entrada.
 *
 * Viven aqui y no dentro de `releases.ts` porque montan pantallas completas:
 * colgarlas de los datos metia Deudas, Movimientos y los graficos en la
 * descarga inicial de la app, ya que la barra lateral y el aviso de novedades
 * leen esos datos para saber la version. Solo la pantalla de Novedades importa
 * este archivo, y llega cuando se entra en ella.
 *
 * La correspondencia es por titulo; `releasePreviews.test.ts` vigila que
 * ninguna quede huerfana.
 */
export const RELEASE_PREVIEWS: Record<string, ComponentType> = {
  "Te dice la verdad cuando algo falla": ServiceErrorPreview,
  "¿Llego a fin de mes?": MonthBalancePreview,
  "Presupuesto: ¿voy muy rápido?": BudgetPacePreview,
  "Reportes: qué cambió frente al mes anterior": CategoryChangesPreview,
  "Te confirma lo que guardas": ToastPreview,
  "Avisos más limpios": BudgetAlertPreview,
  "Deudas: el color dice hacia dónde va el dinero": DebtsModulePreview,
  "Elegir el tipo dejó de ser un desplegable": DebtKindPickerPreview,
  "Movimientos ya no se arrastra de lado": MovementsMobilePreview,
  "Lo que se repite se registra solo": RecurrencePreview,
  "Te avisa antes de pasarte del presupuesto": BudgetAlertPreview,
  "Cuánto apartar al mes para llegar a tu meta": GoalPacePreview,
  "Ahora sabe cuánto dinero tienes": BalancePreview,
  "Deudas, préstamos y sanes": SanPreview,
  "Foto del recibo": ReceiptPreview,
  "Funciona sin internet": OfflinePreview,
  "Recordatorio diario": ReminderPreview
};
