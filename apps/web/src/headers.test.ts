import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Las cabeceras que manda el servidor con cada pagina.
 *
 * No las ve nadie y no las prueba ningun clic, pero son lo que impide que
 * alguien meta Rumbo dentro de un iframe suyo, que el navegador adivine el
 * tipo de un archivo o que un script colado tenga a donde mandar lo que lea.
 * Viven en `vercel.json`, que no se compila ni se revisa solo: de ahi esta
 * prueba.
 */
function readVercelConfig(): string {
  for (const candidate of ["../../vercel.json", "vercel.json"]) {
    try {
      return readFileSync(candidate, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error("no encuentro vercel.json");
}

describe("las cabeceras de seguridad", () => {
  const config = JSON.parse(readVercelConfig()) as {
    headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
  };

  const todas = new Map(
    (config.headers ?? []).flatMap((entry) =>
      entry.headers.map((header) => [header.key.toLowerCase(), header.value] as const)
    )
  );

  it("cubren todas las rutas", () => {
    expect(config.headers?.some((entry) => entry.source === "/(.*)")).toBe(true);
  });

  it("nadie puede meter la app dentro de su pagina", () => {
    expect(todas.get("content-security-policy")).toMatch(/frame-ancestors 'none'/);
  });

  it("el navegador no adivina tipos de archivo", () => {
    expect(todas.get("x-content-type-options")).toBe("nosniff");
  });

  it("obliga a https en adelante", () => {
    expect(todas.get("strict-transport-security")).toMatch(/max-age=\d{7,}/);
  });

  it("no filtra a donde iba la persona", () => {
    expect(todas.get("referrer-policy")).toBe("strict-origin-when-cross-origin");
  });

  it("un script colado no tiene a donde hablar", () => {
    const csp = todas.get("content-security-policy") ?? "";
    expect(csp).toMatch(/default-src 'self'/);
    expect(csp).toMatch(/script-src 'self'/);
    // La app habla con Supabase y con nadie mas.
    expect(csp).toMatch(/connect-src [^;]*supabase\.co/);
    expect(csp).not.toMatch(/script-src[^;]*unsafe-eval/);
  });
});
