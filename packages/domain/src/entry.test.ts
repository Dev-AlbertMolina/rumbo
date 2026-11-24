import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Lo que el navegador se descarga de este paquete.
 *
 * La web usa las cuentas (`calculateSummary` y compania) y los tipos; los
 * esquemas de validacion son cosa de la API, que es quien recibe lo que
 * escribe la gente. Estaban en el mismo archivo, asi que zod —una libreria de
 * validacion entera— viajaba al telefono de todo el mundo para nada: unos
 * 50 KB en la primera carga.
 *
 * Los tipos derivados de los esquemas si pueden cruzar, porque `export type`
 * no deja rastro al compilar.
 */
function readSource(name: string): string {
  for (const base of ["src", "packages/domain/src"]) {
    try {
      return readFileSync(`${base}/${name}`, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error(`no encuentro ${name}`);
}

describe("la entrada del paquete", () => {
  it("no arrastra zod al navegador", () => {
    const source = readSource("index.ts");
    const importaZod = /^import\s+(?!type\b)[^;]*from\s+"zod"/m.test(source);

    expect(importaZod, "index.ts importa zod en tiempo de ejecucion").toBe(false);
  });

  it("los esquemas siguen existiendo, en su sitio", () => {
    const schemas = readSource("schemas.ts");

    expect(schemas).toMatch(/from "zod"/);
    expect(schemas).toMatch(/createMovementSchema/);
  });
});
