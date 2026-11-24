import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChunkBoundary } from "./ChunkBoundary";

afterEach(cleanup);

function Exploding(): never {
  throw new Error("Failed to fetch dynamically imported module");
}

/**
 * Con las pantallas cargandose al entrar, quedarse sin red a mitad deja de ser
 * un detalle: el trozo de codigo no llega y React desmonta el arbol. Sin esto,
 * la persona se queda mirando una pagina en blanco.
 */
describe("ChunkBoundary", () => {
  it("ofrece reintentar cuando la pantalla no se pudo descargar", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <ChunkBoundary>
        <Exploding />
      </ChunkBoundary>
    );

    expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos cargar esta sección/i);
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });

  it("no estorba cuando todo va bien", () => {
    render(
      <ChunkBoundary>
        <p>Contenido</p>
      </ChunkBoundary>
    );

    expect(screen.getByText("Contenido")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
