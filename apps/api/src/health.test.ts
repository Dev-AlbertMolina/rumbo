import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { FinancePersistence, UserFinanceRepository } from "./persistence.js";
import type { AuthVerifier } from "./auth/supabase-verifier.js";

/**
 * La ruta que visita el vigilante diario. Vive en su propio archivo, con una
 * persistencia de mentira, porque lo que se comprueba aqui es que la ruta
 * pregunta a la base y traduce la respuesta: no hace falta una base de verdad
 * para eso, y asi estas pruebas corren sin Docker. Que el `ping` real hable
 * con Postgres lo comprueban las pruebas de integracion y la verificacion
 * contra produccion tras desplegar.
 */
function persistenceThatAnswers(alive: boolean): FinancePersistence {
  return {
    forUser(): UserFinanceRepository {
      throw new Error("La ruta de salud no debe tocar los datos de nadie.");
    },
    async close() {},
    async ping() {
      return alive;
    }
  };
}

const authVerifier: AuthVerifier = {
  async verify() {
    throw new Error("La ruta de salud no verifica sesiones.");
  }
};

describe("GET /api/health", () => {
  it("responde sin token, porque la visita diaria no tiene sesion", async () => {
    const app = buildApp(persistenceThatAnswers(true), { authVerifier });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok", database: "ok" });
  });

  it("dice que la base esta caida en vez de reventar", async () => {
    const app = buildApp(persistenceThatAnswers(false), { authVerifier });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "degraded", database: "down" });
  });

  it("dice que esta caida tambien cuando preguntar revienta", async () => {
    // Una base que rechaza la conexion hace que `ping` lance, no que devuelva
    // false. Sin recogerlo, el vigilante recibe un 500 de Fastify sin cuerpo:
    // sabe que algo va mal y nada mas.
    const persistence: FinancePersistence = {
      forUser(): UserFinanceRepository {
        throw new Error("La ruta de salud no debe tocar los datos de nadie.");
      },
      async close() {},
      async ping(): Promise<boolean> {
        throw new Error("connection refused");
      }
    };
    const app = buildApp(persistence, { authVerifier });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "degraded", database: "down" });
  });

  it("no se queda esperando para siempre a una base que no contesta", async () => {
    // Lo que hace una base sobrecargada: acepta la conexion y no responde. Sin
    // plazo propio, la peticion se queda colgada y el vigilante no se entera de
    // nada, que es justo lo contrario de para lo que existe.
    const persistence: FinancePersistence = {
      forUser(): UserFinanceRepository {
        throw new Error("La ruta de salud no debe tocar los datos de nadie.");
      },
      async close() {},
      ping() {
        return new Promise<boolean>(() => undefined);
      }
    };
    const app = buildApp(persistence, { authVerifier, healthTimeoutMs: 20 });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({ status: "degraded", database: "down" });
  });

  it("la excepcion es esa ruta exacta, no todo lo que empiece igual", async () => {
    const app = buildApp(persistenceThatAnswers(true), { authVerifier });
    const response = await app.inject({ method: "GET", url: "/api/healthzzz" });

    expect(response.statusCode).toBe(401);
  });

  it("no abre la puerta al resto de la API", async () => {
    const app = buildApp(persistenceThatAnswers(true), { authVerifier });
    const response = await app.inject({ method: "GET", url: "/api/spaces" });

    expect(response.statusCode).toBe(401);
  });
});
