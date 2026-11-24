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

  it("tiene algo que decir cuando no llega un Error", () => {
    expect(describeAuthError(undefined)).toMatch(/inténtalo/i);
  });
});
