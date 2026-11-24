import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { BottomNav } from "./BottomNav";
import { Sidebar } from "./Sidebar";

/**
 * Cual es la pestana en la que estas.
 *
 * Antes lo decia solo el color, y el color se le escapa a cerca de uno de
 * cada doce hombres. Phosphor trae el mismo dibujo en varios pesos, asi que
 * ahora lo dice tambien la forma: la pestana actual va rellena y las demas en
 * contorno. Eso se ve igual en blanco y negro.
 */
describe("la pestana en la que estas", () => {
  afterEach(() => cleanup());

  it("se dibuja rellena en la barra de abajo", () => {
    const { container } = render(<BottomNav pathname="/metas" />);

    const activa = container.querySelector("a.active svg");
    expect(activa?.getAttribute("data-weight"), "la activa").toBe("fill");
  });

  it("y las demas en contorno", () => {
    const { container } = render(<BottomNav pathname="/metas" />);

    const otras = [...container.querySelectorAll("a:not(.active) svg")];
    expect(otras.length).toBeGreaterThan(3);
    expect(otras.every((svg) => svg.getAttribute("data-weight") === "regular")).toBe(true);
  });

  it("lo mismo en la barra lateral", () => {
    const { container } = render(
      <Sidebar pathname="/deudas" user={null} onSignOut={() => undefined} onAdd={() => undefined} />
    );

    expect(container.querySelector("a.active svg")?.getAttribute("data-weight")).toBe("fill");
  });
});
