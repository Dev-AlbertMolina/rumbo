import { calculateMonthBalance, formatDop, type Movement } from "@ahorra/domain";
import { type KeyboardEvent, type PointerEvent, useState } from "react";
import { useElementWidth } from "../../hooks/useElementWidth";
import { monthName, today } from "../../lib/format";

const HEIGHT = 220;
const MARGIN = { top: 28, right: 14, bottom: 30, left: 56 };
const compact = new Intl.NumberFormat("es-DO", {
  notation: "compact",
  compactDisplay: "long",
  maximumFractionDigits: 1
});

/** Paso redondo (1, 2 o 5 por una potencia de 10) para unas cuatro lineas de guia. */
function niceStep(range: number): number {
  const rough = range / 4;
  const power = 10 ** Math.floor(Math.log10(rough));
  const unit = rough / power;
  return (unit <= 1 ? 1 : unit <= 2 ? 2 : unit <= 5 ? 5 : 10) * power;
}

/** "el dia 13", "del 13 al 15" o "4 dias", segun como caigan. */
function describeDays(days: number[]): string {
  if (days.length === 1) return `el día ${days[0]}`;
  const together = days.every((day, index) => index === 0 || day === days[index - 1]! + 1);
  return together ? `del ${days[0]} al ${days.at(-1)}` : `${days.length} días`;
}

/**
 * ¿Llego a fin de mes? El disponible del mes dia a dia.
 *
 * El titulo es la respuesta y el grafico, la prueba: linea continua hasta hoy
 * con lo registrado, punteada hasta el cierre con lo programado, y en rojo los
 * dias en que el dinero no alcanza. Reemplaza a "Mirada al cierre", que daba la
 * cifra final con una linea sin ejes que ni siquiera contaba lo programado.
 */
export function MonthBalanceChart({ movements, month }: { movements: Movement[]; month: string }) {
  const [figureRef, width] = useElementWidth<HTMLElement>(640);
  const [active, setActive] = useState<number | null>(null);

  const now = today();
  const { points, lastRegisteredDay, endCents, lowest, negativeDays } = calculateMonthBalance(
    movements,
    month,
    now
  );
  const days = points.length;
  const name = monthName(month);
  const closed = now.slice(0, 7) > month;

  const title =
    endCents >= 0
      ? `${closed ? "Cerraste" : "Cierras"} ${name} con ${formatDop(endCents)}`
      : `${closed ? "Cerraste" : "Cierras"} ${name} en ${formatDop(endCents)}`;
  const detail =
    negativeDays.length === 0
      ? closed
        ? "No estuviste en negativo ningún día."
        : "Con lo registrado y lo programado, no quedas en negativo ningún día."
      : `${closed ? "Estuviste" : "Quedas"} en negativo ${describeDays(negativeDays)}; lo más bajo ${
          closed ? "fue" : "es"
        } ${formatDop(lowest.cents)} el día ${lowest.day}.`;

  const plotWidth = Math.max(160, width - MARGIN.left - MARGIN.right);
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom;
  const band = plotWidth / days;
  const values = points.map((point) => point.cents);
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values, low + 100_00);
  const step = niceStep(high - low);
  const bottomTick = Math.floor(low / step) * step;
  const topTick = Math.ceil(high / step) * step;
  const ticks: number[] = [];
  for (let tick = bottomTick; tick <= topTick; tick += step) ticks.push(tick);

  const x = (boundary: number) => MARGIN.left + boundary * band;
  const y = (cents: number) =>
    MARGIN.top + ((topTick - cents) / (topTick - bottomTick)) * plotHeight;

  // Escalonada: el dinero no cambia a lo largo del dia sino de golpe, asi que
  // cada dia es un tramo plano que empieza con lo que dejo el anterior.
  function stepPath(from: number, to: number): string {
    let path = `M${x(from - 1)},${y(from === 1 ? 0 : points[from - 2]!.cents)}`;
    for (let day = from; day <= to; day++) {
      path += ` V${y(points[day - 1]!.cents)} H${x(day)}`;
    }
    return path;
  }

  const hasRegistered = lastRegisteredDay >= 1;
  const hasProjection = lastRegisteredDay < days;
  const endY = y(endCents);
  const labelDays = plotWidth < 380 ? [1, 15, days] : [1, 8, 15, 22, days];
  const activePoint = active === null ? null : points[active - 1]!;

  function dayAt(event: PointerEvent<SVGRectElement>): number {
    const bounds = event.currentTarget.ownerSVGElement!.getBoundingClientRect();
    const offset = event.clientX - bounds.left - MARGIN.left;
    return Math.min(days, Math.max(1, Math.floor(offset / band) + 1));
  }

  // Con las flechas se recorre dia a dia, empezando por hoy.
  function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      setActive(null);
      return;
    }
    const start = Math.max(1, lastRegisteredDay);
    const moves: Record<string, number> = {
      ArrowLeft: active === null ? start : active - 1,
      ArrowRight: active === null ? start : active + 1,
      Home: 1,
      End: days
    };
    if (!(event.key in moves)) return;
    event.preventDefault();
    setActive(Math.min(days, Math.max(1, moves[event.key]!)));
  }

  return (
    <section className="panel month-chart">
      <header>
        <div>
          <p className="eyebrow">Tu mes día a día</p>
          <h2>{title}</h2>
          <p className="month-chart-detail">{detail}</p>
        </div>
      </header>

      <figure
        ref={figureRef}
        className="month-chart-figure"
        tabIndex={0}
        aria-label={`Disponible de cada día de ${name}. Usa las flechas para recorrer los días.`}
        onKeyDown={onKeyDown}
      >
        <svg width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} aria-hidden="true">
          {ticks.map((tick) => (
            <g key={tick}>
              <line
                className={tick === 0 ? "month-chart-zero" : "month-chart-grid"}
                x1={MARGIN.left}
                x2={x(days)}
                y1={y(tick)}
                y2={y(tick)}
              />
              <text x={MARGIN.left - 8} y={y(tick) + 4} textAnchor="end">
                {compact.format(tick / 100)}
              </text>
            </g>
          ))}

          {negativeDays.map((day) => (
            <rect
              key={day}
              className="month-chart-negative"
              x={x(day - 1)}
              y={y(0)}
              width={band}
              height={y(points[day - 1]!.cents) - y(0)}
            />
          ))}

          {!closed && hasRegistered && hasProjection && (
            <g>
              <line
                className="month-chart-today"
                x1={x(lastRegisteredDay)}
                x2={x(lastRegisteredDay)}
                y1={MARGIN.top - 6}
                y2={HEIGHT - MARGIN.bottom}
              />
              <text
                className="month-chart-strong"
                x={x(lastRegisteredDay)}
                y={14}
                textAnchor="middle"
              >
                Hoy
              </text>
            </g>
          )}

          {hasRegistered && (
            <path className="month-chart-line" d={stepPath(1, lastRegisteredDay)} />
          )}
          {hasProjection && (
            <path
              className="month-chart-line projected"
              d={stepPath(lastRegisteredDay + 1, days)}
            />
          )}

          <circle
            className={`month-chart-dot${hasProjection ? " projected" : ""}`}
            cx={x(days)}
            cy={endY}
            r={4.5}
          />

          {labelDays.map((day) => (
            <text key={day} x={x(day - 0.5)} y={HEIGHT - 8} textAnchor="middle">
              {day}
            </text>
          ))}

          {activePoint && (
            <g>
              <line
                className="month-chart-guide"
                x1={x(activePoint.day - 0.5)}
                x2={x(activePoint.day - 0.5)}
                y1={MARGIN.top}
                y2={HEIGHT - MARGIN.bottom}
              />
              <circle
                className="month-chart-dot"
                cx={x(activePoint.day - 0.5)}
                cy={y(activePoint.cents)}
                r={4}
              />
            </g>
          )}

          <rect
            className="month-chart-hit"
            x={MARGIN.left}
            y={0}
            width={plotWidth}
            height={HEIGHT}
            onPointerDown={(event) => setActive(dayAt(event))}
            onPointerMove={(event) => setActive(dayAt(event))}
            onPointerLeave={(event) => {
              // Con el dedo, el valor se queda a la vista al soltar.
              if (event.pointerType === "mouse") setActive(null);
            }}
          />
        </svg>

        {activePoint && (
          <div
            className="month-chart-tip"
            style={{ left: Math.min(width - 80, Math.max(80, x(activePoint.day - 0.5))) }}
          >
            <strong>{formatDop(activePoint.cents)}</strong>
            <span>
              {activePoint.day} de {name}
              {activePoint.registered ? "" : " · programado"}
            </span>
          </div>
        )}
        <span className="sr-only" aria-live="polite">
          {activePoint ? `Día ${activePoint.day}: ${formatDop(activePoint.cents)}` : ""}
        </span>
      </figure>

      {hasRegistered && hasProjection && (
        <p className="month-chart-legend">
          <span>
            <i aria-hidden="true" /> Registrado
          </span>
          <span>
            <i className="projected" aria-hidden="true" /> Programado
          </span>
        </p>
      )}
    </section>
  );
}
