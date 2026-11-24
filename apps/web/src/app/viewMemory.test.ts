import { beforeEach, describe, expect, it } from "vitest";
import {
  forgetViews,
  recallFilters,
  recallScroll,
  rememberFilters,
  rememberScroll
} from "./viewMemory";

/**
 * Volver a una pestana deberia devolverte donde estabas. Antes cada cambio de
 * seccion te mandaba arriba del todo y borraba los filtros, asi que ir a mirar
 * una cifra y volver costaba rehacer el camino.
 */
describe("viewMemory", () => {
  beforeEach(() => forgetViews());

  it("devuelve lo guardado por ruta y no mezcla rutas", () => {
    rememberScroll("/movimientos", 420);

    expect(recallScroll("/movimientos")).toBe(420);
    expect(recallScroll("/metas")).toBe(0);
  });

  it("devuelve el valor por defecto cuando no hay nada guardado", () => {
    expect(recallFilters("/movimientos", { type: "ALL" })).toEqual({ type: "ALL" });
  });

  it("recuerda los filtros de una ruta", () => {
    rememberFilters("/movimientos", { type: "EXPENSE", period: "MONTH" });

    expect(recallFilters("/movimientos", { type: "ALL", period: "ALL" })).toEqual({
      type: "EXPENSE",
      period: "MONTH"
    });
  });

  it("olvida todo cuando cambia la sesion", () => {
    rememberScroll("/movimientos", 420);
    rememberFilters("/movimientos", { type: "EXPENSE" });

    forgetViews();

    expect(recallScroll("/movimientos")).toBe(0);
    expect(recallFilters("/movimientos", { type: "ALL" })).toEqual({ type: "ALL" });
  });
});
