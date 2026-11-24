import "fake-indexeddb/auto";
import { describe, expect, it } from "vitest";
import { unsentWarning } from "./signOutGuard";

/**
 * Cerrar sesion borra del aparato lo de esa persona, pendientes incluidos. Es
 * lo correcto en un telefono que se presta, pero un gasto anotado sin
 * conexion se iria sin que nadie lo sepa. El aviso es lo que lo evita.
 */
describe("el aviso antes de cerrar sesion", () => {
  it("habla en singular cuando es uno solo", () => {
    expect(unsentWarning(1)).toMatch(/1 movimiento sin enviar/);
    expect(unsentWarning(1)).not.toMatch(/movimientos/);
  });

  it("dice cuantos son cuando son varios", () => {
    expect(unsentWarning(3)).toMatch(/3 movimientos sin enviar/);
  });

  it("avisa de que se pierden, no de que se guardan", () => {
    expect(unsentWarning(2)).toMatch(/se pierden/);
  });
});
