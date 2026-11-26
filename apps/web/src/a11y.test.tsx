import { readFileSync } from "node:fs";
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { contrast, normalDistance, PAPER } from "./lib/palette";
import { StatusPill, type StatusPillTone } from "./components/StatusPill";

/**
 * El repaso final: que nada dependa solo del color, y que el color que haya
 * se vea.
 *
 * Son dos reglas distintas y las dos se rompen solas. Una marca que solo se
 * distingue por el tono deja fuera a quien no lo distingue; una marca que no
 * contrasta con el papel no la ve nadie.
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

function tokenOf(name: string): string {
  const value = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`falta el token ${name}`);
  return value;
}

describe("las barras de Reportes", () => {
  /** El color con el que se pinta cada barra, en orden. */
  const bars = [0, 1, 2].map((index) => {
    const block = css.match(new RegExp(`\\.bar-${index}\\s*\\{[^}]*\\}`))?.[0] ?? "";
    const token = block.match(/background:\s*var\((--[\w-]+)\)/)?.[1];
    if (!token) throw new Error(`.bar-${index} no se pinta con un token`);
    return { index, token, color: tokenOf(token) };
  });

  it("cada barra se ve contra el papel", () => {
    // Tres a uno es el minimo de una marca que significa algo. El dorado
    // daba 2.03 y la barra de ahorro casi no se despegaba del fondo.
    for (const bar of bars) {
      expect(contrast(bar.color, PAPER), `barra ${bar.index} (${bar.token})`).toBeGreaterThanOrEqual(
        3
      );
    }
  });

  it("y se distingue de las otras dos", () => {
    for (const bar of bars) {
      for (const otra of bars) {
        if (bar.index >= otra.index) continue;
        expect(
          normalDistance(bar.color, otra.color),
          `barra ${bar.index} vs barra ${otra.index}`
        ).toBeGreaterThanOrEqual(15);
      }
    }
  });

  it("habla el idioma de la app: entra, sale, se aparta", () => {
    expect(bars.map((bar) => bar.token)).toEqual(["--success", "--terracotta", "--primary"]);
  });
});

describe("los estados", () => {
  afterEach(() => cleanup());

  it("nunca dependen solo del color", () => {
    // Cada pastilla lleva su palabra y su icono. Si alguien deja solo el
    // color, quien no lo distingue se queda sin el estado.
    const tonos: StatusPillTone[] = [
      "registered",
      "scheduled",
      "active",
      "paused",
      "completed"
    ];
    for (const tone of tonos) {
      const { container, unmount } = render(<StatusPill tone={tone} label={`Estado ${tone}`} />);
      expect(container.querySelector("svg"), `${tone}: sin icono`).not.toBeNull();
      expect(container.textContent, `${tone}: sin palabra`).toContain(tone);
      unmount();
    }
  });
});
