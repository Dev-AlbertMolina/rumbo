import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Dos reglas de la hoja de estilos que cuesta dinero romper y que ninguna
 * prueba de componente llega a ver.
 */
describe("styles.css", () => {
  const css = readFileSync("src/styles.css", "utf8");

  it("no usa backdrop-filter: cuesta 125 ms la primera vez que se abre un dialogo", () => {
    expect(css).not.toContain("backdrop-filter");
  });

  it("sigue apagando el movimiento para quien lo pidio", () => {
    expect(css).toContain("transition: none !important");
    expect(css).toContain("animation-duration: 0.01ms !important");
  });
});
