import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/**
 * Que el dinero de cada quien se quede con quien es.
 *
 * La API entra a Postgres con su propia conexion, no con la sesion de la
 * persona, asi que las politicas de la base (RLS) no la frenan: lo unico que
 * separa a una persona de otra es que cada consulta lleve su `user_id`. Hoy
 * lo sostiene la disciplina de quien la escribe, y basta olvidarlo una vez.
 *
 * Esta prueba lee el fuente y lo comprueba. Es una prueba de texto, con lo que
 * eso tiene de tosco, pero corre sin Docker y sin base: la que comprueba el
 * aislamiento de verdad vive entre las nueve que exigen un Postgres local y
 * que, por eso mismo, casi nunca corre nadie.
 */

/** Tablas donde cada fila es de alguien. Salen de las migraciones. */
const USER_SCOPED = [
  "spaces",
  "categories",
  "movements",
  "budgets",
  "budget_limits",
  "goals",
  "goal_contributions",
  "recurring_movements",
  "debts",
  "debt_payments"
];

function readRepository(): string {
  for (const candidate of [
    "src/database/postgres/repository.ts",
    "apps/api/src/database/postgres/repository.ts"
  ]) {
    try {
      return readFileSync(candidate, "utf8");
    } catch {
      continue;
    }
  }
  throw new Error("no encuentro repository.ts");
}

/** Cada literal de plantilla que contenga SQL, con su linea. */
function sqlStatements(source: string): Array<{ sql: string; line: number }> {
  const statements: Array<{ sql: string; line: number }> = [];
  const re = /`([^`]*)`/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(source))) {
    const sql = match[1]!;
    if (!/\b(select|insert\s+into|update|delete\s+from)\b/i.test(sql)) continue;
    statements.push({ sql, line: source.slice(0, match.index).split("\n").length });
  }
  return statements;
}

/** Las consultas que tocan datos de alguien sin nombrar a ese alguien. */
function unscopedQueries(source: string): string[] {
  return sqlStatements(source)
    .filter(({ sql }) => USER_SCOPED.some((table) => sql.includes(`public.${table}`)))
    .filter(({ sql }) => !sql.includes("user_id"))
    .map(({ line, sql }) => `linea ${line}: ${sql.trim().slice(0, 90).replace(/\s+/g, " ")}`);
}

describe("el aislamiento entre personas", () => {
  const source = readRepository();
  const statements = sqlStatements(source);

  it("hay consultas que mirar", () => {
    // Si un dia este archivo deja de tener SQL, la prueba pasaria vacia y
    // nadie se enteraria de que ya no vigila nada.
    expect(statements.length).toBeGreaterThan(20);
  });

  it("toda consulta a una tabla de alguien nombra a ese alguien", () => {
    expect(unscopedQueries(source), "consultas sin dueno").toEqual([]);
  });

  it("y si alguien escribe una que no, se nota", () => {
    // Una prueba que nunca ha fallado no protege de nada: esto demuestra que
    // el cerrojo cierra. Es la consulta que algun dia escribira alguien con
    // prisa, y la que enseñaria el dinero de otra persona.
    const descuido = "const q = `select * from public.movements where id = $1`;";

    expect(unscopedQueries(descuido)).toHaveLength(1);
  });
});
