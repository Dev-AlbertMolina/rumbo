import { z } from "zod";
import { movementTypes, movementStatuses, recurrenceFrequencies, debtKinds } from "./index.js";

/**
 * Los esquemas que validan lo que llega a la API.
 *
 * Viven aparte de las cuentas porque zod solo hace falta aqui: la web usa los
 * calculos y los tipos, y arrastrarla hasta el navegador costaba unos 50 KB en
 * la primera carga de todo el mundo. Los tipos derivados si cruzan, porque
 * `export type` no deja rastro al compilar.
 */

export const entityIdSchema = z.uuid();

export const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

const amountCentsSchema = z.number().int().nonnegative().max(9_000_000_000_000_000);

export const createMovementSchema = z.object({
  spaceId: entityIdSchema,
  type: z.enum(movementTypes),
  status: z.enum(movementStatuses),
  amountCents: amountCentsSchema.positive(),
  effectiveDate: z.iso.date(),
  description: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  /** Ruta de la foto del recibo dentro del bucket, no la imagen. */
  // nullish y no default(null): asi la clave queda opcional en el tipo, y los
  // movimientos sin recibo no tienen que declararlo en cada sitio.
  receiptPath: z.string().trim().max(400).nullish()
});

export const budgetLimitSchema = z.object({
  spaceId: entityIdSchema,
  month: monthSchema,
  category: z.string().trim().min(1).max(80),
  limitCents: amountCentsSchema
});

export const createGoalSchema = z.object({
  spaceId: entityIdSchema,
  name: z.string().trim().min(1).max(120),
  targetCents: amountCentsSchema.positive(),
  initialAmountCents: amountCentsSchema.default(0),
  targetDate: z.iso.date().nullable(),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM")
});

export const goalContributionSchema = z.object({
  amountCents: amountCentsSchema.positive(),
  effectiveDate: z.iso.date()
});

export const createRecurringMovementSchema = z.object({
  spaceId: entityIdSchema,
  type: z.enum(movementTypes),
  /**
   * Meta a la que va el aporte. Obligatoria para CONTRIBUTION y prohibida para
   * el resto: sin ella no se sabria a donde va el dinero, y con ella un gasto
   * corriente fingiria ser un ahorro.
   */
  goalId: entityIdSchema.nullable().default(null),
  frequency: z.enum(recurrenceFrequencies),
  amountCents: amountCentsSchema.positive(),
  description: z.string().trim().min(1).max(160),
  category: z.string().trim().min(1).max(80),
  startDate: z.iso.date(),
  endDate: z.iso.date().nullable().default(null)
});

function checkRecurringGoal(
  value: { type: string; goalId: string | null },
  context: z.RefinementCtx
) {
  if (value.type === "CONTRIBUTION" && !value.goalId) {
    context.addIssue({ code: "custom", path: ["goalId"], message: "Elige la meta." });
  }
  if (value.type !== "CONTRIBUTION" && value.goalId) {
    context.addIssue({
      code: "custom",
      path: ["goalId"],
      message: "Solo un aporte puede apuntar a una meta."
    });
  }
}

export const updateRecurringMovementSchema = createRecurringMovementSchema
  .omit({ spaceId: true })
  .extend({ active: z.boolean().default(true) })
  .superRefine(checkRecurringGoal);

export const createDebtSchema = z
  .object({
    spaceId: entityIdSchema,
    kind: z.enum(debtKinds),
    name: z.string().trim().min(1).max(120),
    counterparty: z.string().trim().max(120).nullable().default(null),
    principalCents: amountCentsSchema.default(0),
    installmentCents: amountCentsSchema.default(0),
    members: z.number().int().min(2).max(100).nullable().default(null),
    turnPosition: z.number().int().min(1).max(100).nullable().default(null),
    dueDate: z.iso.date().nullable().default(null),
    notes: z.string().trim().max(1000).nullable().default(null)
  })
  .superRefine((value, context) => {
    if (value.kind === "SAN") {
      // Un san sin cuota, sin miembros o con un turno fuera de la rueda no se
      // puede calcular. Mejor rechazarlo que devolver una cifra inventada.
      if (value.installmentCents <= 0) {
        context.addIssue({
          code: "custom",
          path: ["installmentCents"],
          message: "Indica la cuota."
        });
      }
      if (value.members === null) {
        context.addIssue({ code: "custom", path: ["members"], message: "Indica cuántos son." });
      }
      if (value.turnPosition === null) {
        context.addIssue({ code: "custom", path: ["turnPosition"], message: "Indica tu turno." });
      }
      if (
        value.members !== null &&
        value.turnPosition !== null &&
        value.turnPosition > value.members
      ) {
        context.addIssue({
          code: "custom",
          path: ["turnPosition"],
          message: "El turno no puede pasar del número de miembros."
        });
      }
      return;
    }
    if (value.principalCents <= 0) {
      context.addIssue({ code: "custom", path: ["principalCents"], message: "Indica el monto." });
    }
  });

export const debtPaymentSchema = z.object({
  amountCents: amountCentsSchema.positive(),
  effectiveDate: z.iso.date()
});

export const createExpenseCategorySchema = z.object({
  spaceId: entityIdSchema,
  name: z.string().trim().min(2).max(80)
});

export const updateExpenseCategorySchema = z.object({
  name: z.string().trim().min(2).max(80)
});

export type CreateMovement = z.infer<typeof createMovementSchema>;

export type BudgetLimitInput = z.infer<typeof budgetLimitSchema>;

export type CreateGoal = z.infer<typeof createGoalSchema>;

export type GoalContributionInput = z.infer<typeof goalContributionSchema>;

export type CreateExpenseCategory = z.infer<typeof createExpenseCategorySchema>;

export type UpdateExpenseCategory = z.infer<typeof updateExpenseCategorySchema>;

export type CreateRecurringMovement = z.infer<typeof createRecurringMovementSchema>;

export type UpdateRecurringMovement = z.infer<typeof updateRecurringMovementSchema>;

export type CreateDebt = z.infer<typeof createDebtSchema>;

export type DebtPaymentInput = z.infer<typeof debtPaymentSchema>;

export const openingBalanceSchema = z.object({
  openingBalanceCents: z.number().int().min(-9_000_000_000_000_000).max(9_000_000_000_000_000)
});

export type OpeningBalanceInput = z.infer<typeof openingBalanceSchema>;

export const createRecurringMovementSchemaChecked =
  createRecurringMovementSchema.superRefine(checkRecurringGoal);
