import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * El ritmo del espacio y la firma de la forma.
 *
 * Rumbo tiene una esquina propia —la inferior derecha recortada— y un ritmo
 * de espaciado. El plan decia que el ritmo era de 4 y que ya casi se
 * respetaba; al medirlo resulto falso: 424 valores van de dos en dos y 69
 * eran impares sueltos, puestos a ojo. Lo que se bloquea aqui es el ritmo que
 * la app tiene de verdad, no el que el plan imaginaba.
 */
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

const css = readStyles();

/** Cada valor en px de una declaracion de espacio, con su linea. */
function spacingValues(): Array<{ value: number; line: number; text: string }> {
  const out: Array<{ value: number; line: number; text: string }> = [];
  const re = /(padding|margin|gap|row-gap|column-gap)(-top|-right|-bottom|-left|-block|-inline)?:\s*([^;]+);/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(css))) {
    for (const raw of match[3]!.match(/-?\d+px/g) ?? []) {
      out.push({
        value: Math.abs(parseInt(raw, 10)),
        line: css.slice(0, match.index).split("\n").length,
        text: match[0]!.trim()
      });
    }
  }
  return out;
}

describe("el espacio", () => {
  it("va de dos en dos, sin valores sueltos", () => {
    const sueltos = spacingValues()
      .filter(({ value }) => value > 0 && value % 2 === 1)
      .map(({ line, text }) => `linea ${line}: ${text}`);

    expect(sueltos, "espacios impares").toEqual([]);
  });
});

describe("la esquina recortada", () => {
  /** Cada bloque de reglas, con su selector. */
  const blocks = css
    .split(/\n(?=[.#a-zA-Z[][^{\n]*\{)/)
    .map((block) => ({ selector: block.split("{")[0]!.trim(), body: block }));

  it("es firma de superficie: nunca va en un boton ni en un campo", () => {
    const malos = blocks
      .filter(({ body }) => /radius-signature/.test(body))
      .filter(({ selector }) =>
        /button|input|select|textarea|\.chip|\.btn\b|\.primary\b|\.secondary\b/.test(selector)
      )
      .map(({ selector }) => selector);

    expect(malos, "la firma en algo que se pulsa o se escribe").toEqual([]);
  });

  it("sigue estando donde si es firma", () => {
    // Si alguien la quita de los paneles, deja de ser una firma y pasa a ser
    // un detalle suelto en tres pantallas.
    expect(css).toMatch(/\.panel\s*\{[^}]*radius-signature/);
  });
});

/** Contraste WCAG entre dos colores solidos. */
function contrast(a: string, b: string): number {
  const channel = (hex: string, i: number) => {
    const value = parseInt(hex.slice(i, i + 2), 16) / 255;
    return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
  };
  const luminance = (hex: string) =>
    0.2126 * channel(hex, 1) + 0.7152 * channel(hex, 3) + 0.0722 * channel(hex, 5);
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

function token(name: string): string {
  const value = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`falta el token ${name}`);
  return value;
}

/**
 * El anillo que marca donde estas al moverte con el teclado.
 *
 * Estaba en dorado, que da 2.03:1 contra el papel: por debajo del 3:1 que
 * necesita cualquier marca que signifique algo. Quien navega sin raton no
 * veia donde estaba.
 */
describe("el foco del teclado", () => {
  const colores = [...css.matchAll(/--focus-(inner|outer):\s*(#[0-9a-f]{6})/gi)].map((m) => m[2]!);

  it("se ve sobre el papel", () => {
    expect(colores.length, "faltan los tokens del foco").toBeGreaterThanOrEqual(2);
    const visible = colores.some((color) => contrast(color, token("--paper")) >= 3);
    expect(visible, "ningun color del anillo se ve sobre el papel").toBe(true);
  });

  it("y tambien sobre el ciruela del hero", () => {
    const visible = colores.some((color) => contrast(color, token("--primary")) >= 3);
    expect(visible, "ningun color del anillo se ve sobre el ciruela").toBe(true);
  });

  it("no queda ningun anillo en dorado", () => {
    const dorados = css.match(/outline:[^;]*var\(--accent\)/g) ?? [];
    expect(dorados, "anillos de foco en dorado").toEqual([]);
  });
});
