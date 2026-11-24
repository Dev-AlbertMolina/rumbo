import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * La tipografia de los titulares.
 *
 * Fraunces es la serif que sale por defecto en casi todo lo generado con IA:
 * correcta, y de nadie. Newsreader tiene mas contraste, aguanta a 20 px en
 * los titulos de seccion y trae el rango de pesos en un archivo variable.
 *
 * Atkinson Hyperlegible se queda para el texto y las cifras: esta disenada
 * para leerse, y aqui se leen cantidades de dinero.
 */
function read(file: string): string {
  for (const base of ["src", "apps/web/src"]) {
    try {
      return readFileSync(`${base}/${file}`, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error(`no encuentro ${file}`);
}

describe("la tipografia", () => {
  const css = read("styles.css");

  it("los titulares ya no son Fraunces", () => {
    expect(css).not.toMatch(/Fraunces/);
    expect(read("main.tsx")).not.toMatch(/fraunces/i);
  });

  it("sale de un token y no de cada regla", () => {
    expect(css).toMatch(/--font-display:/);
    const sueltas = css.match(/font-family:\s*"(?!var)/g) ?? [];
    // Solo la declaracion del token y la del texto base nombran una fuente.
    expect(sueltas.length, "reglas que nombran una fuente a mano").toBeLessThanOrEqual(2);
  });

  it("tiene una pila de respaldo de verdad", () => {
    const token = css.match(/--font-display:([^;]+);/)?.[1] ?? "";
    expect(token).toMatch(/Newsreader/);
    expect(token).toMatch(/Georgia|serif/);
  });
});
