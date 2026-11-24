import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Dos reglas de la hoja de estilos que cuesta dinero romper y que ninguna
 * prueba de componente llega a ver.
 */
describe("styles.css", () => {
  const css = readFileSync("src/styles.css", "utf8");

  it("no usa backdrop-filter: la primera apertura de cada sesion pasaba de 146 a 83 ms sin el", () => {
    expect(css).not.toContain("backdrop-filter");
  });

  it("sigue apagando el movimiento para quien lo pidio", () => {
    expect(css).toContain("transition: none !important");
    expect(css).toContain("animation-duration: 0.01ms !important");
  });
});
