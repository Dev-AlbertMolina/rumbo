import { describe, expect, it } from "vitest";
import { buildApp } from "./app.js";
import type { FinancePersistence, UserFinanceRepository } from "./persistence.js";
import type { AuthVerifier } from "./auth/supabase-verifier.js";

/**
 * Un tope de peticiones por sesion.
 *
 * La API corre sin servidor: cada peticion se paga y cada una abre conexion
 * contra la base. Sin tope, un bucle mal escrito —o alguien con ganas— puede
 * costar dinero y tumbar la base para todo el mundo. No protege de nada
 * sofisticado; evita lo tonto, que es lo que pasa.
 */
function persistence(): FinancePersistence {
  return {
    forUser(): UserFinanceRepository {
      throw new Error("Estas pruebas no tocan datos.");
    },
    async close() {},
    async ping() {
      return true;
    }
  };
}

const authVerifier: AuthVerifier = {
  async verify() {
    throw new Error("Estas pruebas no verifican sesiones.");
  }
};

/** Pide `times` veces y devuelve el ultimo codigo distinto de 429, y si hubo 429. */
async function hammer(app: ReturnType<typeof buildApp>, times: number, url: string) {
  let limited = false;
  for (let i = 0; i < times; i++) {
    const response = await app.inject({ method: "GET", url });
    if (response.statusCode === 429) limited = true;
  }
  return limited;
}

describe("el tope de peticiones", () => {
  it("corta al que insiste demasiado rapido", async () => {
    const app = buildApp(persistence(), { authVerifier, rateLimit: { max: 5, timeWindow: 1000 } });

    expect(await hammer(app, 12, "/api/health")).toBe(true);
  });

  it("no estorba al uso normal", async () => {
    const app = buildApp(persistence(), { authVerifier, rateLimit: { max: 5, timeWindow: 1000 } });

    expect(await hammer(app, 4, "/api/health")).toBe(false);
  });

  it("el que se pasa recibe una explicacion en castellano", async () => {
    const app = buildApp(persistence(), { authVerifier, rateLimit: { max: 1, timeWindow: 1000 } });
    await app.inject({ method: "GET", url: "/api/health" });
    const response = await app.inject({ method: "GET", url: "/api/health" });

    expect(response.statusCode).toBe(429);
    expect(response.json().message).toMatch(/demasiadas peticiones/i);
  });
});

/**
 * Que origenes pueden hablar con la API.
 *
 * Los `localhost` de desarrollo estaban permitidos siempre, tambien en
 * produccion. El riesgo era bajo —el token va en cabecera, no en cookie, asi
 * que una pagina ajena no lo tiene— pero es una puerta abierta que no hace
 * falta. Los origenes de la app nativa si van siempre: no son configurables
 * por despliegue, son los que trae Capacitor.
 */
async function allowedFrom(app: ReturnType<typeof buildApp>, origin: string) {
  const response = await app.inject({
    method: "OPTIONS",
    url: "/api/spaces",
    headers: { origin, "access-control-request-method": "GET" }
  });
  return response.headers["access-control-allow-origin"] === origin;
}

describe("los origenes permitidos", () => {
  it("en produccion no deja entrar a los localhost de desarrollo", async () => {
    const app = buildApp(persistence(), { authVerifier, production: true });

    expect(await allowedFrom(app, "http://localhost:5173")).toBe(false);
  });

  it("fuera de produccion si, que es donde se desarrolla", async () => {
    const app = buildApp(persistence(), { authVerifier, production: false });

    expect(await allowedFrom(app, "http://localhost:5173")).toBe(true);
  });

  it("la app del telefono entra siempre", async () => {
    const app = buildApp(persistence(), { authVerifier, production: true });

    expect(await allowedFrom(app, "capacitor://localhost")).toBe(true);
  });
});
