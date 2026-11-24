import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { StaleNotice } from "./StaleNotice";

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

/** Lo que de verdad ve el ojo cuando un texto se pinta con opacidad encima del papel. */
function blend(ink: string, paper: string, alpha: number): string {
  const parts = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  const [foreground, background] = [parts(ink), parts(paper)];
  return (
    "#" +
    foreground
      .map((value, i) =>
        Math.round(alpha * value + (1 - alpha) * background[i]!)
          .toString(16)
          .padStart(2, "0")
      )
      .join("")
  );
}

const PAPER = "#fff8f0";
const INK = "#2b211e";
const MUTED = "#665851";

describe("el aviso de que el mes viene en camino", () => {
  it("el atenuado no deja el texto por debajo de lo legible", () => {
    const declared = readStyles().match(/\.page-transition\.is-stale\s*\{[^}]*opacity:\s*([\d.]+)/);
    expect(declared, "no encuentro la regla del atenuado").not.toBeNull();
    const alpha = Number(declared![1]);

    // Las cifras de dinero no pueden quedar por debajo de 4.5:1 mientras se
    // espera al mes nuevo: lo que avisa es el aviso, no la penumbra.
    expect(contrast(blend(INK, PAPER, alpha), PAPER)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(blend(MUTED, PAPER, alpha), PAPER)).toBeGreaterThanOrEqual(4.5);
  });

  it("lo dice con palabras, para quien no ve la penumbra", () => {
    render(<StaleNotice />);
    const notice = screen.getByRole("status");
    expect(notice.textContent).toMatch(/actualizando/i);
  });
});
