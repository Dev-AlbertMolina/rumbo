import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  chroma,
  contrast,
  cvdDistance,
  DATA_COLORS,
  normalDistance,
  PAPER,
  TEXT_COLORS
} from "./palette";

/** Desde la raiz del repositorio o desde apps/web: la prueba vale igual. */
function readStyles(): string {
  for (const candidate of ["src/styles.css", "apps/web/src/styles.css"]) {
    try {
      return readFileSync(candidate, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error("no encuentro styles.css");
}

/**
 * Los colores de Rumbo, medidos en vez de elegidos a ojo.
 *
 * En Deudas el verde significa que te deben y el rojo que debes. Para la forma
 * mas comun de daltonismo —cerca de uno de cada doce hombres— esos dos estados
 * se veian casi iguales: 5.5 de distancia, cuando ocho es el minimo para
 * distinguirlos. Hoy lo salva que cada tarjeta lleva su etiqueta; el color,
 * por si solo, mentia.
 *
 * Estas pruebas son el cerrojo: cualquiera puede cambiar un color, pero no
 * puede dejarlo en un sitio donde deje de verse.
 */

/** Lo que no se puede confundir, porque significan cosas opuestas. */
const PARES_QUE_DEBEN_DISTINGUIRSE: Array<[string, string]> = [
  ["money_in", "money_out"],
  ["debt", "loan"]
];

describe("la paleta", () => {
  it("el texto se lee sobre el papel", () => {
    for (const [name, color] of Object.entries(TEXT_COLORS)) {
      expect(contrast(color, PAPER), `texto ${name}`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it("los colores de dato se ven contra el papel", () => {
    // Tres a uno es el minimo para una marca —una barra, un punto, un borde—
    // que no es texto pero tiene que distinguirse del fondo.
    for (const [name, color] of Object.entries(DATA_COLORS)) {
      expect(contrast(color, PAPER), `dato ${name}`).toBeGreaterThanOrEqual(3);
    }
  });

  it("ningun color de dato se lee como gris", () => {
    for (const [name, color] of Object.entries(DATA_COLORS)) {
      expect(chroma(color), `croma de ${name}`).toBeGreaterThanOrEqual(0.1);
    }
  });

  it("lo que significa cosas opuestas se distingue con daltonismo", () => {
    for (const [a, b] of PARES_QUE_DEBEN_DISTINGUIRSE) {
      const first = DATA_COLORS[a]!;
      const second = DATA_COLORS[b]!;
      for (const kind of ["deuteranopia", "protanopia"] as const) {
        expect(cvdDistance(first, second, kind), `${a} vs ${b} (${kind})`).toBeGreaterThanOrEqual(
          8
        );
      }
    }
  });
});

/**
 * Los mismos valores, pero en la hoja de estilos: de nada sirve medirlos aqui
 * si lo que la app pinta es otra cosa.
 */
describe("los tokens de la hoja de estilos", () => {
  const css = readStyles();

  it("usa los colores medidos, no otros parecidos", () => {
    expect(css).toContain(`--success: ${DATA_COLORS.money_in};`);
    expect(css).toContain(`--success-ink: ${TEXT_COLORS.success_ink};`);
    expect(css).toContain(`--danger: ${TEXT_COLORS.danger};`);
  });

  it("el verde de marca nunca se usa como letra", () => {
    // 3.32:1 se ve de sobra en una barra y no se lee en un texto. Para letra
    // esta --success-ink, que da 5.66:1.
    // Sin enganchar `border-color`, que si es una marca y puede llevarlo.
    const comoLetra = css.match(/(?<![-\w])color:\s*var\(--success\)/g) ?? [];
    expect(comoLetra, "hay texto pintado con el verde de marca").toEqual([]);
  });
});

/**
 * Un solo acento por pantalla, y el color siempre desde un token.
 *
 * Competian ciruela, terracota, dorado, verde, rojo, ambar y violeta sin
 * jerarquia, y ademas habia colores escritos a mano en reglas sueltas, donde
 * nadie los mide ni los encuentra al cambiar la paleta.
 */
describe("la jerarquia del color", () => {
  const css = readStyles();

  it("ningun color se escribe a mano fuera de los tokens", () => {
    const sueltos: string[] = [];
    let inRoot = false;
    css.split("\n").forEach((line, index) => {
      if (/^:root/.test(line)) inRoot = true;
      else if (inRoot && line.trim() === "}") inRoot = false;
      if (inRoot || /^\s*--/.test(line)) return;
      if (/#[0-9a-fA-F]{3,8}\b/.test(line)) sueltos.push(`linea ${index + 1}: ${line.trim()}`);
    });

    expect(sueltos, "colores a mano").toEqual([]);
  });

  it("el morado marca, no ocupa", () => {
    // Elegido mirando las tres dosis: en una pantalla de dinero el color no
    // puede pesar mas que las cifras. El morado va en el icono, el borde y la
    // etiqueta; el fondo se queda como el del resto.
    const comoFondo = css.match(/background:s*var(--pending[a-z-]*)/g) ?? [];
    expect(comoFondo, "el morado usado como superficie").toEqual([]);
  });

  it("el morado de lo que aun no ha pasado se distingue del ciruela", () => {
    // Lo retire por ser un septimo color sin jerarquia, y el dueno lo pidio de
    // vuelta: separa bien lo programado de lo que ya ocurrio. Medido, tiene
    // razon. Lo que no puede es confundirse con el ciruela de la marca.
    const morado = css.match(/--pending:\s*(#[0-9a-f]{6})/i)?.[1];
    expect(morado, "falta el token del morado").toBeDefined();
    expect(contrast(morado!, PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(chroma(morado!)).toBeGreaterThanOrEqual(0.1);
    expect(normalDistance(morado!, TEXT_COLORS.primary!)).toBeGreaterThanOrEqual(15);
    expect(cvdDistance(morado!, TEXT_COLORS.primary!, "deuteranopia")).toBeGreaterThanOrEqual(8);
  });
});
