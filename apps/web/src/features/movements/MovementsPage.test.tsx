import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import type { Movement } from "@ahorra/domain";
import { MovementsPage } from "./MovementsPage";
import { forgetViews, recallFilters, rememberFilters } from "../../app/viewMemory";

function movement(id: string, description: string): Movement {
  return {
    id,
    spaceId: "espacio",
    type: "EXPENSE",
    status: "REGISTERED",
    amountCents: 1_000_00,
    effectiveDate: "2026-11-05",
    description,
    category: "Alimentacion",
    createdAt: "2026-11-05T12:00:00.000Z"
  };
}

const noop = () => undefined;

/**
 * La pantalla recuerda sus filtros mientras dure la sesion. Que ademas decida
 * ella sola bajo que nombre guardarlos la ataba a su ruta: montarla en otro
 * sitio —la vista previa de Novedades, por ejemplo— le cambiaba los filtros de
 * verdad a quien estuviera usando Movimientos.
 */
describe("MovementsPage", () => {
  beforeEach(() => forgetViews());

  it("lee los filtros del nombre que le den", () => {
    rememberFilters("/ejemplo", {
      query: "supermercado",
      type: "ALL",
      status: "ALL",
      period: "ALL",
      rangeFrom: "",
      rangeTo: ""
    });

    render(
      <MovementsPage
        movements={[movement("1", "Supermercado"), movement("2", "Luz")]}
        onAdd={noop}
        onEdit={noop}
        viewPath="/ejemplo"
      />
    );

    expect((screen.getByLabelText(/buscar/i) as HTMLInputElement).value).toBe("supermercado");
  });

  it("no escribe en la memoria de Movimientos cuando la montan en otro sitio", () => {
    render(
      <MovementsPage
        movements={[movement("1", "Supermercado")]}
        onAdd={noop}
        onEdit={noop}
        viewPath="/ejemplo"
      />
    );

    // Nada, ni siquiera los filtros vacios: escribir ahi borraria lo que la
    // persona tenga puesto en Movimientos de verdad.
    expect(recallFilters("/movimientos", null)).toBeNull();
  });
});
