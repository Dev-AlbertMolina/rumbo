import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import type { Movement } from "@ahorra/domain";
import { MonthAnswer } from "./MonthAnswer";

const MONTH = "2026-11";

function movement(day: number, type: "INCOME" | "EXPENSE", amountCents: number): Movement {
  return {
    id: `${type}-${day}`,
    spaceId: "personal",
    type,
    status: day <= 24 ? "REGISTERED" : "SCHEDULED",
    amountCents,
    effectiveDate: `${MONTH}-${String(day).padStart(2, "0")}`,
    description: type === "INCOME" ? "Quincena" : "Gasto",
    category: "Alimentacion",
    createdAt: `${MONTH}-01T12:00:00.000Z`
  };
}

function renderAnswer(movements: Movement[], availableCents: number) {
  return render(
    <MonthAnswer
      month={MONTH}
      today="2026-11-24"
      movements={movements}
      availableCents={availableCents}
    />
  );
}

/**
 * Inicio contesta una pregunta, no enseña un tablero.
 *
 * La cifra sola no dice nada: RD$28,500 es mucho el dia 2 y poco el dia 28.
 * Lo que la persona quiere saber al abrir la app es si llega, y con cuanto.
 */
describe("la respuesta del mes", () => {
  afterEach(() => cleanup());

  it("pregunta primero y contesta con una cifra", () => {
    const { container, getByRole } = renderAnswer(
      [movement(1, "INCOME", 64_000_00), movement(5, "EXPENSE", 35_500_00)],
      28_500_00
    );

    expect(getByRole("heading", { level: 2 }).textContent).toMatch(/llego a fin de mes/i);
    const titulares = container.querySelectorAll("h1");
    expect(titulares).toHaveLength(1);
    expect(titulares[0]?.textContent).toMatch(/28,500/);
  });

  it("dice con cuanto llegas cuando el mes cierra bien", () => {
    const { container } = renderAnswer(
      [movement(1, "INCOME", 64_000_00), movement(5, "EXPENSE", 35_500_00)],
      28_500_00
    );

    expect(container.textContent).toMatch(/llegas con/i);
    expect(container.textContent).toMatch(/28,500/);
    expect(container.textContent).toMatch(/6 días/);
  });

  it("avisa del dia en que te quedas corto aunque el mes cierre bien", () => {
    const { container } = renderAnswer(
      [
        movement(1, "INCOME", 10_000_00),
        movement(20, "EXPENSE", 12_000_00),
        movement(26, "INCOME", 30_000_00)
      ],
      -2_000_00
    );

    expect(container.textContent).toMatch(/día 20/i);
  });

  it("dice cuanto falta cuando no llegas", () => {
    const { container } = renderAnswer(
      [movement(1, "INCOME", 20_000_00), movement(10, "EXPENSE", 35_000_00)],
      -15_000_00
    );

    expect(container.textContent).toMatch(/te faltan/i);
    expect(container.textContent).toMatch(/15,000/);
  });
});
