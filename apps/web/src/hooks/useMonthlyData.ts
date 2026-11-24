import { startTransition, useEffect, useState } from "react";
import { calculateSummary, type Movement, type Summary } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { readJson } from "../lib/format";
import { pendingMovements } from "../lib/offline/outbox";
import { forgetViews } from "../app/viewMemory";

const emptySummary: Summary = {
  incomeCents: 0,
  expenseCents: 0,
  contributionCents: 0,
  availableBeforeSavingsCents: 0,
  availableAfterSavingsCents: 0,
  projectedAvailableCents: 0,
  expenseByCategory: []
};

/**
 * Las cifras no viajan solas: viajan con el mes al que pertenecen.
 *
 * Es lo que permite saber, en cualquier render, si lo que se ve es del mes que
 * la persona pidio o del anterior. Guardar "estoy cargando" por separado no
 * sirve: entre que llegan los datos nuevos y que se apaga el indicador cabe un
 * render, y en ese render las cifras de octubre se leen bajo el rotulo de
 * diciembre como si fueran suyas.
 */
interface MonthData {
  month: string;
  movements: Movement[];
  summary: Summary;
}

const emptyData: MonthData = { month: "", movements: [], summary: emptySummary };

export function useMonthlyData(
  accessToken: string | undefined,
  spaceId: string,
  month: string,
  refreshKey: number,
  userId: string | undefined
) {
  const [data, setData] = useState<MonthData>(emptyData);
  const [error, setError] = useState("");

  useEffect(() => {
    setData(emptyData);
    forgetViews();
  }, [userId]);

  useEffect(() => {
    if (!accessToken || !spaceId) {
      setData({ month, movements: [], summary: emptySummary });
      return;
    }
    const controller = new AbortController();
    // Una peticion que ya fue reemplazada no puede tocar el estado: lo que
    // escriba seria del mes que la persona dejo atras.
    let current = true;
    setError("");

    Promise.all([
      apiFetch(
        accessToken,
        `/api/movements?spaceId=${encodeURIComponent(spaceId)}&month=${month}`,
        { signal: controller.signal }
      ).then((response) => readJson<Movement[]>(response)),
      userId ? pendingMovements(userId, spaceId, month) : Promise.resolve<Movement[]>([])
    ])
      .then(([serverMovements, queued]) => {
        // Lo pendiente se mezcla con lo del servidor y el resumen se recalcula
        // aqui en vez de pedirlo: el servidor no sabe nada de lo que aun no ha
        // recibido, y ver un gasto en la lista que no descuenta del disponible
        // haria dudar de todas las cifras.
        if (!current) return;
        const all = [...queued, ...serverMovements];
        startTransition(() => {
          setData({ month, movements: all, summary: calculateSummary(all) });
        });
      })
      .catch(async (reason: unknown) => {
        if (!current) return;
        if (reason instanceof DOMException && reason.name === "AbortError") return;
        setError(reason instanceof Error ? reason.message : "Ocurrio un error inesperado.");
        // Sin servidor se muestra lo que hay guardado en el aparato, y nada
        // mas: las cifras del mes anterior con el rotulo de este mentirian.
        const queued = userId
          ? await pendingMovements(userId, spaceId, month).catch(() => [] as Movement[])
          : [];
        if (!current) return;
        startTransition(() => {
          setData({ month, movements: queued, summary: calculateSummary(queued) });
        });
      });

    return () => {
      current = false;
      controller.abort();
    };
  }, [accessToken, spaceId, month, refreshKey, userId]);

  // Cambiar de mes no vacia la pantalla: lo anterior se queda a la vista,
  // atenuado, hasta que llega lo nuevo. Solo la primera carga, cuando no hay
  // nada que conservar, muestra esqueletos. Y refrescar el mes que ya estas
  // viendo no atenua nada, porque lo que se ve sigue siendo de ese mes.
  const fresh = data.month === month;
  const stale = !fresh && data.movements.length > 0;
  const loading = !fresh && data.movements.length === 0;

  return {
    summary: data.summary,
    movements: data.movements,
    loading,
    stale,
    error
  };
}
