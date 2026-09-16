import { useEffect, useState } from "react";
import type { Summary } from "@ahorra/domain";
import { apiFetch } from "../lib/api";
import { previousMonth, readJson } from "../lib/format";

/** Fetches the prior month's summary so charts can show a light reference. */
export function usePreviousMonthSummary(
  accessToken: string | undefined,
  spaceId: string,
  month: string
): Summary | null {
  const [summary, setSummary] = useState<Summary | null>(null);

  useEffect(() => {
    setSummary(null);
    if (!accessToken || !spaceId) return;
    const controller = new AbortController();
    apiFetch(
      accessToken,
      `/api/summary?spaceId=${encodeURIComponent(spaceId)}&month=${previousMonth(month)}`,
      { signal: controller.signal }
    )
      .then((response) => readJson<Summary>(response))
      .then((result) => setSummary(result))
      .catch(() => {});
    return () => controller.abort();
  }, [accessToken, spaceId, month]);

  return summary;
}
