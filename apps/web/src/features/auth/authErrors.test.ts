import { describe, expect, it } from "vitest";
import { describeAuthError } from "./authErrors";

/**
 * En septiembre de 2026 el proyecto de Supabase se pauso por inactividad y la
 * pantalla decia "Revisa los datos e intentalo de nuevo". Nueve dias buscando
 * una contrasena mal escrita que nunca lo estuvo.
 */
describe("describeAuthError", () => {
  it("distingue que el servidor no responde de unos datos mal escritos", () => {
    expect(describeAuthError(new TypeError("Failed to fetch"))).toMatch(/no pudimos conectar/i);
  });

  it("reconoce el fallo de red que envuelve Supabase", () => {
    const error = new Error("Network request failed");
    error.name = "AuthRetryableFetchError";
    expect(describeAuthError(error)).toMatch(/no pudimos conectar/i);
  });

  it("avisa cuando la sesion caduco", () => {
    expect(describeAuthError(new Error("JWT expired"))).toMatch(/sesión/i);
  });

  it("repite el motivo del servidor cuando lo da", () => {
    expect(describeAuthError(new Error("Invalid login credentials"))).toBe(
      "Invalid login credentials"
    );
  });

  it("culpa al servidor cuando Supabase responde con un 503", () => {
    // Lo que de verdad llego en septiembre: el proyecto pausado contesta, pero
    // contesta un error de servicio, en ingles, y eso se mostraba tal cual.
    const error = Object.assign(new Error("Service temporarily unavailable"), { status: 503 });
    expect(describeAuthError(error)).toMatch(/no pudimos conectar/i);
  });

  it("tambien cuando la peticion no llego a ninguna parte (status 0)", () => {
    const error = Object.assign(new Error("fetch failed"), { status: 0 });
    expect(describeAuthError(error)).toMatch(/no pudimos conectar/i);
  });

  it("no se inventa una caida cuando el rechazo es por los datos", () => {
    const error = Object.assign(new Error("Invalid login credentials"), { status: 400 });
    expect(describeAuthError(error)).toBe("Invalid login credentials");
  });

  it("tiene algo que decir cuando no llega un Error", () => {
    expect(describeAuthError(undefined)).toMatch(/inténtalo/i);
  });
});
