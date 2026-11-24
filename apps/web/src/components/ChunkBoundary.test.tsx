import { cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ChunkBoundary } from "./ChunkBoundary";

function Explota({ reason }: { reason: Error }): never {
  throw reason;
}

describe("ChunkBoundary", () => {
  beforeEach(() => vi.spyOn(console, "error").mockImplementation(() => undefined));
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("culpa a la conexion cuando el trozo de codigo no llego", () => {
    const { getByRole } = render(
      <ChunkBoundary>
        <Explota reason={new Error("Failed to fetch dynamically imported module")} />
      </ChunkBoundary>
    );

    expect(getByRole("alert").textContent).toMatch(/conexión/i);
  });

  it("no culpa a la conexion cuando lo que falla es la pantalla", () => {
    // Un grafico que revienta en Inicio no es un problema de red, y decirle a
    // la persona que revise su conexion la manda a arreglar lo que no esta roto.
    const { getByRole } = render(
      <ChunkBoundary>
        <Explota reason={new TypeError("cannot read properties of undefined")} />
      </ChunkBoundary>
    );

    expect(getByRole("alert").textContent).not.toMatch(/conexión/i);
  });
});
