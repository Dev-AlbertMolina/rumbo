import "fake-indexeddb/auto";
import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Movement } from "@ahorra/domain";
import { useMonthlyData } from "./useMonthlyData";

function movement(id: string, month: string): Movement {
  return {
    id,
    spaceId: "espacio",
    type: "EXPENSE",
    status: "REGISTERED",
    amountCents: 1_000_00,
    effectiveDate: `${month}-05`,
    description: "Gasto de " + month,
    category: "Alimentacion",
    createdAt: `${month}-05T12:00:00.000Z`
  };
}

/** Responde a cada mes lo que diga el guion, y avisa cuando le preguntan. */
function serverWith(byMonth: Record<string, Movement[]>) {
  let resolvePending: (() => void) | null = null;
  const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
    const month = String(input).match(/month=([\d-]+)/)?.[1] ?? "";
    if (resolvePending) await new Promise<void>((resolve) => (resolvePending = resolve));
    return new Response(JSON.stringify(byMonth[month] ?? []), {
      headers: { "Content-Type": "application/json" }
    });
  });
  return {
    fetchMock,
    hold() {
      resolvePending = () => undefined;
    }
  };
}

describe("useMonthlyData", () => {
  beforeEach(() => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async () => new Response("[]", { headers: { "Content-Type": "application/json" } })
    );
  });

  afterEach(() => vi.restoreAllMocks());

  it("conserva el mes anterior mientras llega el nuevo, y lo marca como viejo", async () => {
    const { fetchMock } = serverWith({
      "2026-10": [movement("octubre", "2026-10")],
      "2026-11": [movement("noviembre-1", "2026-11"), movement("noviembre-2", "2026-11")]
    });
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const { result, rerender } = renderHook(
      ({ month }) => useMonthlyData("token", "espacio", month, 0, "usuario"),
      { initialProps: { month: "2026-10" } }
    );
    await waitFor(() => expect(result.current.movements).toHaveLength(1));
    expect(result.current.stale).toBe(false);

    rerender({ month: "2026-11" });
    expect(result.current.movements).toHaveLength(1);

    await waitFor(() => expect(result.current.movements).toHaveLength(2));
    expect(result.current.stale).toBe(false);
  });

  it("vacia de verdad cuando el mes nuevo no trae nada", async () => {
    const { fetchMock } = serverWith({ "2026-10": [movement("octubre", "2026-10")] });
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const { result, rerender } = renderHook(
      ({ month }) => useMonthlyData("token", "espacio", month, 0, "usuario"),
      { initialProps: { month: "2026-10" } }
    );
    await waitFor(() => expect(result.current.movements).toHaveLength(1));

    rerender({ month: "2026-12" });
    await waitFor(() => expect(result.current.movements).toHaveLength(0));
    expect(result.current.summary.expenseCents).toBe(0);
  });

  it("sigue atenuado si cambias de mes dos veces seguidas", async () => {
    // La peticion cancelada no puede apagar el indicador de la que si sigue
    // viva: si lo hace, el mes viejo se queda en pantalla como si fuera el nuevo.
    const octubre = [movement("octubre", "2026-10")];
    vi.spyOn(globalThis, "fetch").mockImplementation(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const month = String(input).match(/month=([\d-]+)/)?.[1] ?? "";
        if (month === "2026-10") {
          return new Response(JSON.stringify(octubre), {
            headers: { "Content-Type": "application/json" }
          });
        }
        // Como el fetch de verdad: al cancelarla, la peticion rechaza.
        return new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("The operation was aborted.", "AbortError"))
          );
        });
      }
    );

    const { result, rerender } = renderHook(
      ({ month }) => useMonthlyData("token", "espacio", month, 0, "usuario"),
      { initialProps: { month: "2026-10" } }
    );
    await waitFor(() => expect(result.current.movements).toHaveLength(1));

    rerender({ month: "2026-11" });
    rerender({ month: "2026-12" });

    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(result.current.movements).toHaveLength(1);
    expect(result.current.stale).toBe(true);
  });

  it("suelta los datos al cambiar de usuario", async () => {
    const { fetchMock } = serverWith({ "2026-10": [movement("octubre", "2026-10")] });
    vi.spyOn(globalThis, "fetch").mockImplementation(fetchMock);

    const { result, rerender } = renderHook(
      ({ userId }) => useMonthlyData("token", "espacio", "2026-10", 0, userId),
      { initialProps: { userId: "usuario" } }
    );
    await waitFor(() => expect(result.current.movements).toHaveLength(1));

    rerender({ userId: "otro" });
    expect(result.current.movements).toHaveLength(0);
  });
});
