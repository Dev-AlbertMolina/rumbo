import { calculateMonthBalance, formatDop, monthVerdict, type Movement } from "@ahorra/domain";

/**
 * Lo primero que se ve al abrir la app: la pregunta y su respuesta.
 *
 * Antes Inicio abria con la cifra disponible y tres cifras mas al lado, y la
 * persona tenia que hacer la cuenta en la cabeza. Una cifra sola no dice
 * nada: RD$28,500 es mucho el dia 2 y poco el dia 28. Lo que se quiere saber
 * al abrir una app de dinero es si se llega.
 *
 * La respuesta sale de como cierra el mes contando lo programado, no de una
 * regla de tres sobre lo gastado: los sanes, la tarjeta y el sueldo tienen
 * fecha, y el dia en que caen es justo lo que decide si alcanza.
 */
export function MonthAnswer({
  month,
  today,
  movements,
  availableCents
}: {
  month: string;
  today: string;
  movements: Movement[];
  availableCents: number;
}) {
  const balance = calculateMonthBalance(movements, month, today);
  const verdict = monthVerdict(balance, month);

  const dias =
    verdict.daysLeft === 0
      ? "El mes ya cerró."
      : verdict.daysLeft === 1
        ? "Es lo que te queda para el día que falta."
        : `Es lo que te queda para los ${verdict.daysLeft} días que faltan.`;

  return (
    <div className="month-answer">
      <h2 className="month-answer-question">¿Llego a fin de mes?</h2>
      <h1 className="month-answer-amount">{formatDop(availableCents)}</h1>
      <p className="month-answer-verdict">
        {dias}{" "}
        {verdict.kind === "ok" && (
          <>
            A este ritmo <b className="is-ok">llegas con {formatDop(verdict.amountCents)} de sobra</b>.
          </>
        )}
        {verdict.kind === "tight" && (
          <>
            El mes cierra bien, pero{" "}
            <b className="is-tight">el día {verdict.firstShortDay} no te alcanza</b>: lo que entra
            después llega tarde.
          </>
        )}
        {verdict.kind === "short" && (
          <>
            A este ritmo <b className="is-short">te faltan {formatDop(verdict.amountCents)}</b> para
            cerrar el mes.
          </>
        )}
      </p>
    </div>
  );
}
