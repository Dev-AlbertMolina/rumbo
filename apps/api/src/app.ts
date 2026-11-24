import { calculateSummary, dominicanDate } from "@ahorra/domain";
// Los esquemas viven aparte para que no viajen al navegador con las cuentas.
import {
  budgetLimitSchema,
  createDebtSchema,
  createExpenseCategorySchema,
  createGoalSchema,
  createMovementSchema,
  createRecurringMovementSchemaChecked,
  debtPaymentSchema,
  entityIdSchema,
  goalContributionSchema,
  monthSchema,
  openingBalanceSchema,
  updateExpenseCategorySchema,
  updateRecurringMovementSchema
} from "@ahorra/domain/schemas";
import cors from "@fastify/cors";
import Fastify, { type FastifyRequest } from "fastify";
import {
  bearerToken,
  type AuthenticatedUser,
  type AuthVerifier
} from "./auth/supabase-verifier.js";
import type { FinancePersistence } from "./persistence.js";

interface BuildAppOptions {
  authVerifier?: AuthVerifier;
  /** Tope de peticiones. Las pruebas lo bajan para no tardar un minuto. */
  rateLimit?: { max: number; timeWindow: number };
  /** Si corre en produccion. Por defecto lo dice NODE_ENV. */
  production?: boolean;
  /** Lo que la ruta de salud espera a la base antes de darla por caida. */
  healthTimeoutMs?: number;
}

/**
 * Tres segundos. Una base sana responde `select 1` en milisegundos; una que
 * tarda mas que esto esta, para lo que importa aqui, caida.
 */
const HEALTH_TIMEOUT_MS = 3_000;

/**
 * Pregunta a la base si esta viva, con plazo propio y sin dejar escapar nada.
 *
 * Es la ruta que mira el vigilante diario, y su unico trabajo es contestar.
 * Una base que rechaza la conexion hace que `ping` lance; una sobrecargada
 * acepta y no responde nunca. En los dos casos la respuesta correcta es la
 * misma, y es una respuesta, no un silencio ni un 500 vacio.
 */
async function databaseAlive(
  persistence: FinancePersistence,
  timeoutMs: number
): Promise<boolean> {
  let timer: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      Promise.resolve(persistence.ping()),
      new Promise<boolean>((resolve) => {
        timer = setTimeout(() => resolve(false), timeoutMs);
      })
    ]);
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export function buildApp(persistence: FinancePersistence, options: BuildAppOptions = {}) {
  const app = Fastify({ logger: false });
  const authenticatedUsers = new WeakMap<FastifyRequest, AuthenticatedUser>();

  // Origenes de la app nativa (Capacitor): Android sirve el bundle desde
  // http://localhost y iOS desde capacitor://localhost. Van siempre permitidos
  // porque no son configurables por despliegue.
  const nativeOrigins = ["http://localhost", "https://localhost", "capacitor://localhost"];
  // Los de desarrollo solo fuera de produccion: alla no hay nadie trabajando
  // en localhost, y dejarlos abiertos es una puerta que no hace falta tener.
  const isProduction = options.production ?? process.env.NODE_ENV === "production";
  const developmentOrigins = isProduction
    ? []
    : ["http://localhost:5173", "http://127.0.0.1:5173", "http://127.0.0.1:4173"];
  const configuredOrigins =
    process.env.CORS_ORIGIN?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? [];
  const allowedOrigins = [...configuredOrigins, ...developmentOrigins, ...nativeOrigins];
  app.register(cors, { origin: allowedOrigins });

  /**
   * Un tope de peticiones por sesion, y por direccion cuando no hay sesion.
   *
   * La API corre sin servidor: cada peticion se paga y abre conexion contra la
   * base. Doscientas por minuto son muchas mas de las que hace nadie usando la
   * app —una pantalla pide cinco o seis— y pocas para un bucle desbocado.
   *
   * Escrito a mano y no con un complemento porque el almacen tendria que ser
   * en memoria igual: cada instancia sin servidor tiene la suya, asi que esto
   * frena lo tonto —un bucle, un script torpe— y no pretende mas.
   *
   * La clave es el token y no el usuario ya verificado porque esto corre
   * antes de verificar; dos pestanas de la misma persona comparten cubo, que
   * es justo lo que se quiere.
   */
  const buckets = new Map<string, { count: number; resetAt: number }>();
  const maxRequests = options.rateLimit?.max ?? 200;
  const windowMs = options.rateLimit?.timeWindow ?? 60_000;

  app.addHook("onRequest", async (request, reply) => {
    const key = request.headers.authorization ?? request.ip;
    const now = Date.now();
    const bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      // Que el mapa no crezca sin fin en una instancia de vida larga.
      if (buckets.size > 5_000) {
        for (const [otherKey, other] of buckets) if (other.resetAt <= now) buckets.delete(otherKey);
      }
      return;
    }

    bucket.count += 1;
    if (bucket.count > maxRequests) {
      return reply
        .code(429)
        .header("Retry-After", Math.ceil((bucket.resetAt - now) / 1000))
        .send({
          message: "Demasiadas peticiones seguidas. Espera un momento y vuelve a intentarlo."
        });
    }
  });

  app.addHook("preHandler", async (request, reply) => {
    // La salud va por /api/ porque vercel.json solo reescribe eso, pero no
    // lleva sesion: la visita diaria que mantiene vivo el proyecto no tiene
    // con quien autenticarse. No devuelve dato de nadie, solo si la base esta.
    if (request.url === "/api/health" || request.url.startsWith("/api/health?")) return;
    if (!request.url.startsWith("/api/") || request.method === "OPTIONS") return;
    if (!options.authVerifier) {
      return reply.code(503).send({ message: "Supabase Auth todavia no esta configurado." });
    }
    const token = bearerToken(request.headers.authorization);
    if (!token) return reply.code(401).send({ message: "Necesitas iniciar sesion." });
    try {
      authenticatedUsers.set(request, await options.authVerifier.verify(token));
    } catch {
      return reply.code(401).send({ message: "La sesion no es valida o ha expirado." });
    }
  });

  function repositoryFor(request: FastifyRequest) {
    const user = authenticatedUsers.get(request);
    if (!user) throw new Error("La ruta financiera se ejecuto sin un usuario autenticado.");
    return persistence.forUser(user.id);
  }

  app.get("/health", async () => ({ status: "ok" }));

  app.get("/api/health", async (_request, reply) => {
    const alive = await databaseAlive(persistence, options.healthTimeoutMs ?? HEALTH_TIMEOUT_MS);
    return alive
      ? { status: "ok", database: "ok" }
      : reply.code(503).send({ status: "degraded", database: "down" });
  });

  app.get("/api/v1/me", async (request, reply) => {
    const user = authenticatedUsers.get(request);
    if (!user) return reply.code(401).send({ message: "Necesitas iniciar sesion." });
    return { id: user.id, email: user.email };
  });

  app.get("/api/spaces", async (request) => repositoryFor(request).listSpaces());

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/movements",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (request.query.month && !monthSchema.safeParse(request.query.month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      await database.materializeDueRecurrences(spaceId, dominicanDate());
      return await database.listMovements(spaceId, request.query.month);
    }
  );

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/summary",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (request.query.month && !monthSchema.safeParse(request.query.month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      // Las recurrencias se materializan al leer, porque el despliegue es
      // serverless y no hay proceso vivo que las despierte a medianoche. Va
      // antes del calculo para que el resumen incluya lo que vencio hoy.
      await database.materializeDueRecurrences(spaceId, dominicanDate());
      return calculateSummary(await database.listMovements(spaceId, request.query.month));
    }
  );

  app.post("/api/movements", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Revisa los datos del movimiento.",
        issues: parsed.error.issues
      });
    }
    if (parsed.data.type === "CONTRIBUTION") {
      return reply.code(400).send({ message: "Los aportes se registran desde una meta." });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }

    const movement = await database.createMovement(parsed.data);
    if (!movement) return reply.code(404).send({ message: "El espacio no existe." });
    return reply.code(201).send(movement);
  });

  app.put<{ Params: { id: string } }>("/api/movements/:id", async (request, reply) => {
    const database = repositoryFor(request);
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "El movimiento no es valido." });
    }
    const parsed = createMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({
        message: "Revisa los datos del movimiento.",
        issues: parsed.error.issues
      });
    }
    if (parsed.data.type === "CONTRIBUTION") {
      return reply.code(400).send({ message: "Los aportes se editan desde una meta." });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }

    const movement = await database.updateMovement(request.params.id, parsed.data);
    if (!movement) {
      return reply.code(404).send({ message: "El movimiento no existe." });
    }
    return movement;
  });

  app.get<{ Querystring: { spaceId?: string; month?: string } }>(
    "/api/budget",
    async (request, reply) => {
      const database = repositoryFor(request);
      const spaceId = request.query.spaceId;
      const month = request.query.month;
      if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
        return reply.code(400).send({ message: "Selecciona un espacio valido." });
      }
      if (!month || !monthSchema.safeParse(month).success) {
        return reply.code(400).send({ message: "Selecciona un periodo valido." });
      }
      if (!(await database.spaceExists(spaceId))) {
        return reply.code(404).send({ message: "El espacio no existe." });
      }
      return await database.listBudgetLimits(spaceId, month);
    }
  );

  app.put("/api/budget", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = budgetLimitSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa el limite." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const limit = await database.upsertBudgetLimit(parsed.data);
    if (!limit) return reply.code(404).send({ message: "El espacio no existe." });
    return limit;
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/goals", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    return await database.listGoals(spaceId);
  });

  app.post("/api/goals", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createGoalSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa los datos de la meta." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const goal = await database.createGoal(parsed.data);
    if (!goal) return reply.code(404).send({ message: "El espacio no existe." });
    return reply.code(201).send(goal);
  });

  app.post<{ Params: { id: string } }>("/api/goals/:id/contributions", async (request, reply) => {
    const database = repositoryFor(request);
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "La meta no es valida." });
    }
    const parsed = goalContributionSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa el aporte." });
    const goal = await database.addGoalContribution(request.params.id, parsed.data);
    if (!goal) return reply.code(404).send({ message: "La meta no existe." });
    return reply.code(201).send(goal);
  });

  app.get<{ Params: { id: string } }>("/api/goals/:id/contributions", async (request, reply) => {
    if (!entityIdSchema.safeParse(request.params.id).success) {
      return reply.code(400).send({ message: "La meta no es valida." });
    }
    return await repositoryFor(request).listGoalContributions(request.params.id);
  });

  app.put<{ Params: { goalId: string; contributionId: string } }>(
    "/api/goals/:goalId/contributions/:contributionId",
    async (request, reply) => {
      const database = repositoryFor(request);
      if (
        !entityIdSchema.safeParse(request.params.goalId).success ||
        !entityIdSchema.safeParse(request.params.contributionId).success
      ) {
        return reply.code(400).send({ message: "El aporte no es valido." });
      }
      const parsed = goalContributionSchema.safeParse(request.body);
      if (!parsed.success) return reply.code(400).send({ message: "Revisa el aporte." });
      const contribution = await database.updateGoalContribution(
        request.params.goalId,
        request.params.contributionId,
        parsed.data
      );
      if (!contribution) return reply.code(404).send({ message: "El aporte no existe." });
      return contribution;
    }
  );

  app.get<{ Querystring: { spaceId?: string } }>("/api/categories", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    return await database.listExpenseCategories(spaceId);
  });

  app.post("/api/categories", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createExpenseCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un nombre valido." });
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const category = await database.createExpenseCategory(parsed.data);
    if (!category)
      return reply.code(409).send({ message: "Ya existe una categoria con ese nombre." });
    return reply.code(201).send(category);
  });

  app.put<{ Params: { id: string } }>("/api/categories/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de categoria invalido." });
    const parsed = updateExpenseCategorySchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un nombre valido." });
    const database = repositoryFor(request);
    const updated = await database.updateExpenseCategory(idResult.data, parsed.data.name);
    if (!updated)
      return reply.code(404).send({ message: "Categoria no encontrada o nombre duplicado." });
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/categories/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de categoria invalido." });
    const database = repositoryFor(request);
    const deleted = await database.deleteExpenseCategory(idResult.data);
    if (!deleted) return reply.code(404).send({ message: "Categoria no encontrada." });
    return reply.code(204).send();
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/debts", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    return await database.listDebts(spaceId);
  });

  app.post("/api/debts", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createDebtSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ message: "Revisa los datos del compromiso.", issues: parsed.error.issues });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const created = await database.createDebt(parsed.data);
    if (!created) return reply.code(400).send({ message: "No pudimos crear el compromiso." });
    return reply.code(201).send(created);
  });

  app.delete<{ Params: { id: string } }>("/api/debts/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID invalido." });
    const database = repositoryFor(request);
    const deleted = await database.deleteDebt(idResult.data);
    if (!deleted) return reply.code(404).send({ message: "Compromiso no encontrado." });
    return reply.code(204).send();
  });

  app.get<{ Params: { id: string } }>("/api/debts/:id/payments", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID invalido." });
    return await repositoryFor(request).listDebtPayments(idResult.data);
  });

  app.post<{ Params: { id: string } }>("/api/debts/:id/payments", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID invalido." });
    const parsed = debtPaymentSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Revisa el monto y la fecha." });
    const debt = await repositoryFor(request).addDebtPayment(idResult.data, parsed.data);
    if (!debt) return reply.code(404).send({ message: "Compromiso no encontrado." });
    return reply.code(201).send(debt);
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/balance", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    // El saldo suma todo lo registrado, asi que lo recurrente vencido tiene que
    // estar ya materializado o la cifra saldria corta.
    await database.materializeDueRecurrences(spaceId, dominicanDate());
    const balance = await database.getBalance(spaceId);
    if (!balance) return reply.code(404).send({ message: "El espacio no existe." });
    return balance;
  });

  app.put<{ Params: { id: string } }>("/api/spaces/:id/opening-balance", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de espacio invalido." });
    const parsed = openingBalanceSchema.safeParse(request.body);
    if (!parsed.success) return reply.code(400).send({ message: "Escribe un saldo valido." });
    const database = repositoryFor(request);
    const balance = await database.setOpeningBalance(
      idResult.data,
      parsed.data.openingBalanceCents
    );
    if (!balance) return reply.code(404).send({ message: "El espacio no existe." });
    return balance;
  });

  app.get<{ Querystring: { spaceId?: string } }>("/api/recurrences", async (request, reply) => {
    const spaceId = request.query.spaceId;
    if (!spaceId || !entityIdSchema.safeParse(spaceId).success) {
      return reply.code(400).send({ message: "Selecciona un espacio valido." });
    }
    const database = repositoryFor(request);
    if (!(await database.spaceExists(spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    await database.materializeDueRecurrences(spaceId, dominicanDate());
    return await database.listRecurringMovements(spaceId);
  });

  app.post("/api/recurrences", async (request, reply) => {
    const database = repositoryFor(request);
    const parsed = createRecurringMovementSchemaChecked.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ message: "Revisa los datos de la recurrencia.", issues: parsed.error.issues });
    }
    if (!(await database.spaceExists(parsed.data.spaceId))) {
      return reply.code(404).send({ message: "El espacio no existe." });
    }
    const created = await database.createRecurringMovement(parsed.data);
    if (!created) return reply.code(400).send({ message: "No pudimos crear la recurrencia." });
    // Una regla que arranca hoy o antes ya tiene ocurrencias que registrar:
    // sin esto no apareceria nada hasta la siguiente lectura.
    await database.materializeDueRecurrences(parsed.data.spaceId, dominicanDate());
    return reply.code(201).send(created);
  });

  app.put<{ Params: { id: string } }>("/api/recurrences/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de recurrencia invalido." });
    const parsed = updateRecurringMovementSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ message: "Revisa los datos de la recurrencia.", issues: parsed.error.issues });
    }
    const database = repositoryFor(request);
    const updated = await database.updateRecurringMovement(idResult.data, parsed.data);
    if (!updated) return reply.code(404).send({ message: "Recurrencia no encontrada." });
    return updated;
  });

  app.delete<{ Params: { id: string } }>("/api/recurrences/:id", async (request, reply) => {
    const idResult = entityIdSchema.safeParse(request.params.id);
    if (!idResult.success) return reply.code(400).send({ message: "ID de recurrencia invalido." });
    const database = repositoryFor(request);
    const deleted = await database.deleteRecurringMovement(idResult.data);
    if (!deleted) return reply.code(404).send({ message: "Recurrencia no encontrada." });
    return reply.code(204).send();
  });

  app.addHook("onClose", async () => persistence.close());
  return app;
}
