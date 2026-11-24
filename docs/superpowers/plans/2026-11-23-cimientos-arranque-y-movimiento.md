# Cimientos: arranque rapido y movimiento sin cortes

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que la app arranque rapido en el telefono, no parpadee al cambiar de mes ni de pantalla, y avise sola si el servicio se cae.

**Architecture:** Cuatro frentes independientes sobre el codigo que ya existe. En la web: quitar el coste de primera vez del desenfoque, cargar cada pantalla al entrar en ella, conservar los datos del mes anterior mientras llega el nuevo, y recordar donde estaba cada pestana. En la API: una ruta publica de salud que toca Postgres, con una tarea programada que la visita a diario.

**Tech Stack:** React 19 + Vite (apps/web), Fastify sobre Vercel serverless (apps/api), dominio puro con Zod (packages/domain), Vitest, Framer Motion, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-23-graficos-estadistica-y-movimiento-design.md`

## Global Constraints

- Paleta de Rumbo: ciruela, terracota y dorado sobre papel crema. **Sin modo oscuro.**
- **Sin APK nuevo**: nada de complementos nativos en esta ronda.
- No tocar `installCommand` de `vercel.json` (borra el lockfile a proposito; npm/cli#4828).
- Texto visible en espanol **con tildes**. Comentarios en espanol sin tildes y mensajes de commit en ingles, como ya esta el repositorio.
- Movimiento: curva `--ease-out` ya definida, por debajo de 300 ms, salida mas rapida que entrada, y respetar `prefers-reduced-motion`.
- No romper el uso sin conexion: la cola de subida (Dexie) sigue mezclandose con lo del servidor.
- Umbral de rendimiento: **ningun fotograma por encima de 32 ms en la primera apertura** del panel de movimiento.
- `npm run typecheck`, `npm run lint` y `npm run test` pasan antes de cada commit.
- El banco de pruebas (`apps/web/harness.html`, `apps/web/src/harness.tsx`) se queda sin versionar y fuera de la compilacion.
- **Nunca `git add apps/web/src` entero**: arrastraria el banco de pruebas al repositorio. Cada commit lista sus archivos.

## Review Focus

1. **Sin conexion al entrar a una pantalla diferida**: el trozo de codigo no se descarga; debe verse un aviso con reintentar, no una pantalla en blanco. Tarea 4.
2. **Sesion caducada a mitad de uso**: debe decir que la sesion expiro, no "revisa los datos". Tarea 2.
3. **Mes sin movimientos**: los datos conservados del mes anterior no pueden quedarse pegados como si fueran del mes nuevo. Tarea 5.
4. **Base de datos caida con la API viva**: la ruta de salud responde que no, en vez de reventar con un 500 sin cuerpo. Tarea 3.
5. **`prefers-reduced-motion` activo**: ni el atenuado del mes ni el aviso de carga introducen movimiento. Lo garantiza el bloque global que ya apaga toda transicion; la tarea 1 lo fija con una prueba para que nadie lo borre.

## Fuera de este plan

- **Las dos pruebas de extremo a extremo** del bloque 1 del diseno. Suplantar la sesion de Supabase necesita antes una prueba de concepto para averiguar el formato exacto del token guardado; planificarlo a ciegas seria adivinar. Va en su propio plan.
- Los bloques 2 al 8 del diseno (kit de graficos, historial, pantallas, reportes, negocio, primera vez). Cada uno tendra su plan.

## Estructura de archivos

| Archivo | Responsabilidad |
| --- | --- |
| `apps/web/src/styles.css` | Quitar el desenfoque; estilo del atenuado |
| `apps/web/src/features/auth/authErrors.ts` (nuevo) | Traducir un fallo de autenticacion al mensaje que se lee |
| `apps/web/src/components/PageFallback.tsx` (nuevo) | Lo que se ve mientras llega una pantalla |
| `apps/web/src/components/ChunkBoundary.tsx` (nuevo) | Aviso con reintentar si el trozo no se descarga |
| `apps/web/src/app/App.tsx` | Carga diferida, limite de error, clase de atenuado |
| `apps/web/src/hooks/useMonthlyData.ts` | Conservar el mes anterior mientras llega el nuevo |
| `apps/web/src/app/viewMemory.ts` (nuevo) | Memoria de scroll y filtros por ruta |
| `apps/web/src/app/router.tsx` | Guardar y restaurar el scroll al navegar |
| `apps/api/src/persistence.ts` | Anadir `ping()` al contrato |
| `apps/api/src/database/postgres/repository.ts` | Implementar `ping()` con `select 1` |
| `apps/api/src/app.ts` | Ruta publica `/api/health` y su excepcion en el guardia |
| `.github/workflows/watchdog.yml` (nuevo) | Visita diaria que mantiene vivo el proyecto y avisa si cae |

---

### Task 1: El fondo de los dialogos deja de desenfocar

Medido: con `backdrop-filter`, la primera apertura cuesta 146 ms; sin el, 21 ms.

**Files:**
- Modify: `apps/web/src/styles.css:2199-2203`
- Test: `apps/web/src/styles.test.ts`

**Interfaces:**
- Consumes: nada.
- Produces: nada que otra tarea importe.

- [ ] **Step 1: Write the failing test**

```ts
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("styles.css", () => {
  const css = readFileSync("src/styles.css", "utf8");

  it("no usa backdrop-filter: cuesta 125 ms la primera vez que se abre un dialogo", () => {
    expect(css).not.toContain("backdrop-filter");
  });

  it("sigue apagando el movimiento para quien lo pidio", () => {
    expect(css).toContain("transition: none !important");
    expect(css).toContain("animation-duration: 0.01ms !important");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/web -- styles`
Expected: FAIL, encuentra la declaracion de la linea 2201.

- [ ] **Step 3: Quitar `backdrop-filter: blur(3px)` de `.dialog-backdrop` y subir su fondo de `rgba(43, 33, 30, 0.34)` a `rgba(43, 33, 30, 0.46)`**

El desenfoque separaba las capas; sin el, esa separacion la hace el fondo un poco mas oscuro.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -w @ahorra/web -- styles`
Expected: PASS

- [ ] **Step 5: Medir que el tiron desaparecio**

Con `npm run dev -w @ahorra/web` levantado y el banco en `http://localhost:5173/harness.html`, medir la primera apertura de `#open-sheet` contando intervalos de `requestAnimationFrame`.
Expected: ningun fotograma por encima de 32 ms.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/styles.css apps/web/src/styles.test.ts
git commit -m "perf(web): drop the dialog backdrop blur, which cost 125ms on first open"
```

---

### Task 2: El inicio de sesion dice la verdad cuando el servidor no responde

Hoy cualquier fallo muestra "Revisa los datos e intentalo de nuevo", incluso con el servicio caido. Paso en septiembre de 2026 y costo nueve dias de diagnostico.

**Files:**
- Create: `apps/web/src/features/auth/authErrors.ts`
- Modify: `apps/web/src/features/auth/AuthScreen.tsx` (bloque `catch`)
- Test: `apps/web/src/features/auth/authErrors.test.ts`

**Interfaces:**
- Produces: `describeAuthError(error: unknown): string`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";
import { describeAuthError } from "./authErrors";

describe("describeAuthError", () => {
  it("distingue que el servidor no responde de unos datos mal escritos", () => {
    expect(describeAuthError(new TypeError("Failed to fetch"))).toMatch(/no pudimos conectar/i);
  });

  it("avisa cuando la sesion caduco", () => {
    expect(describeAuthError(new Error("JWT expired"))).toMatch(/sesión/i);
  });

  it("repite el motivo del servidor cuando lo da", () => {
    expect(describeAuthError(new Error("Invalid login credentials"))).toBe(
      "Invalid login credentials"
    );
  });

  it("tiene algo que decir cuando no llega un Error", () => {
    expect(describeAuthError(undefined)).toMatch(/inténtalo/i);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/web -- authErrors`
Expected: FAIL, el modulo no existe.

- [ ] **Step 3: Implementar `describeAuthError(error: unknown): string` en `apps/web/src/features/auth/authErrors.ts`**

Un fallo de red llega como `TypeError` o con `AuthRetryableFetchError` en `name`; la caducidad trae `JWT` o `expired` en el texto. El mensaje de red, literal: `"No pudimos conectar con el servidor. Revisa tu conexión e inténtalo en un momento."`

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -w @ahorra/web -- authErrors`
Expected: PASS

- [ ] **Step 5: Usarlo en `AuthScreen.tsx`**

Sustituir el calculo del mensaje dentro del `catch` por `setError(describeAuthError(err))`.

- [ ] **Step 6: Run the whole web suite**

Run: `npm run test -w @ahorra/web`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/features/auth
git commit -m "fix(auth): say the server is unreachable instead of blaming the password"
```

---

### Task 3: Vigilante diario

Dos piezas que solo sirven juntas: una ruta publica que de verdad toca Postgres, y una visita diaria que la llama. La visita evita que Supabase pause el proyecto por inactividad, que fue la causa de la caida de septiembre.

`/health` no sirve: `vercel.json` solo reescribe `/api/:path*`, asi que en produccion no existe. Y el guardia de `app.ts` responde 401 a todo `/api/` antes de tocar la base.

**Files:**
- Modify: `apps/api/src/persistence.ts:74-77` (contrato `FinancePersistence`)
- Modify: `apps/api/src/database/postgres/repository.ts:317` (`PostgresFinancePersistence`)
- Modify: `apps/api/src/database/postgres/test-support.ts` (el envoltorio que no cierra el pool delega `ping`)
- Modify: `apps/api/src/app.ts` (excepcion en el `preHandler` y ruta nueva)
- Create: `.github/workflows/watchdog.yml`
- Test: `apps/api/src/app.test.ts`

**Interfaces:**
- Produces: `FinancePersistence.ping(): Awaitable<boolean>`; `GET /api/health`, que responde `{ status: "ok", database: "ok" }` con 200, o `{ status: "degraded", database: "down" }` con 503.

- [ ] **Step 1: Write the failing test**

En `apps/api/src/app.test.ts`, un `describe("GET /api/health")` con tres casos:

```ts
it("responde sin token, porque la visita diaria no tiene sesion", async () => {
  const response = await createTestApp().inject({ method: "GET", url: "/api/health" });
  expect(response.statusCode).toBe(200);
  expect(response.json()).toEqual({ status: "ok", database: "ok" });
});

it("dice que la base esta caida en vez de reventar", async () => {
  const app = buildApp(
    { ...createNonClosingPersistence(pool), ping: async () => false },
    { authVerifier }
  );
  const response = await app.inject({ method: "GET", url: "/api/health" });
  expect(response.statusCode).toBe(503);
  expect(response.json()).toEqual({ status: "degraded", database: "down" });
});

it("no abre la puerta al resto de la API", async () => {
  const response = await createTestApp().inject({ method: "GET", url: "/api/spaces" });
  expect(response.statusCode).toBe(401);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/api`
Expected: FAIL con 404 en la ruta nueva. Necesita `TEST_DATABASE_URL`; en local, `supabase start`.

- [ ] **Step 3: Anadir `ping()` al contrato y a sus implementaciones**

En `PostgresFinancePersistence`, un `select 1` contra el pool que devuelve `false` si lanza. El envoltorio de pruebas delega.

- [ ] **Step 4: Exceptuar `/api/health` en el guardia y anadir la ruta en `app.ts`**

La excepcion va como primera linea del `preHandler`, antes de mirar el token. La ruta no recibe ni devuelve dato de nadie: solo si la base contesta.

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -w @ahorra/api`
Expected: PASS

- [ ] **Step 6: Crear `.github/workflows/watchdog.yml`**

`schedule` diario a las 12:00 UTC mas `workflow_dispatch`, con un paso unico:

```yaml
- run: |
    curl -fsS --max-time 30 https://rumbo-web-sepia.vercel.app/api/health \
      | tee /dev/stderr \
      | grep -q '"database":"ok"'
```

El fallo del workflow es el aviso: GitHub escribe al dueno del repositorio.

- [ ] **Step 7: Commit**

```bash
git add apps/api .github/workflows/watchdog.yml
git commit -m "feat(api): public liveness route plus a daily watchdog that keeps Supabase awake"
```

- [ ] **Step 8: Verificar en produccion tras desplegar**

Run: `curl -s https://rumbo-web-sepia.vercel.app/api/health`
Expected: `{"status":"ok","database":"ok"}`. Despues, lanzar el workflow a mano una vez y comprobar que pasa.

---

### Task 4: Cada pantalla se carga cuando se entra en ella

Hoy el telefono descarga 541 KB antes de ver nada.

**Files:**
- Create: `apps/web/src/components/PageFallback.tsx`
- Create: `apps/web/src/components/ChunkBoundary.tsx`
- Modify: `apps/web/src/app/App.tsx:12-27` (imports) y el bloque de rutas de `:152-300`
- Test: `apps/web/src/components/ChunkBoundary.test.tsx`

**Interfaces:**
- Produces: `PageFallback()`; `ChunkBoundary({ children }: { children: ReactNode })`

- [ ] **Step 1: Write the failing test**

```tsx
import "@testing-library/jest-dom/vitest";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ChunkBoundary } from "./ChunkBoundary";

function Exploding(): never {
  throw new Error("Failed to fetch dynamically imported module");
}

describe("ChunkBoundary", () => {
  it("ofrece reintentar cuando la pantalla no se pudo descargar", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    render(
      <ChunkBoundary>
        <Exploding />
      </ChunkBoundary>
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/no pudimos cargar esta sección/i);
    expect(screen.getByRole("button", { name: /reintentar/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/web -- ChunkBoundary`
Expected: FAIL, el componente no existe.

- [ ] **Step 3: Implementar `ChunkBoundary` y `PageFallback`**

`ChunkBoundary` es un limite de error de clase; su boton recarga la pagina. `PageFallback` reutiliza `.skeleton` con la altura de un panel, para que no salte el diseno. Sin animacion propia: el esqueleto ya respeta `prefers-reduced-motion`.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -w @ahorra/web -- ChunkBoundary`
Expected: PASS

- [ ] **Step 5: Diferir las pantallas en `App.tsx`**

Con `lazy()`: `MovementsPage`, `BudgetPage`, `GoalsPage`, `DebtsPage`, `ReportsPage`, `SettingsPage`, `WhatsNewPage`, `NotFoundPage`. **El Inicio no se difiere**: es la pantalla de entrada. Envolver el bloque de rutas en `<ChunkBoundary><Suspense fallback={<PageFallback />}>`.

- [ ] **Step 6: Run the whole web suite**

Run: `npm run test -w @ahorra/web`
Expected: PASS. Las pruebas de `App.test.tsx` que navegan ya usan `findBy*`, que espera la carga.

- [ ] **Step 7: Comprobar el reparto**

Run: `npm run build -w @ahorra/web`
Expected: trozos por pantalla en `dist/assets/`, y el principal por debajo de 400 KB sin comprimir.

- [ ] **Step 8: Commit**

```bash
git add apps/web/src/app/App.tsx apps/web/src/components/ChunkBoundary.tsx \n  apps/web/src/components/ChunkBoundary.test.tsx apps/web/src/components/PageFallback.tsx
git commit -m "perf(web): load each screen on entry instead of shipping all of them upfront"
```

---

### Task 5: Cambiar de mes ya no vacia la pantalla

**Files:**
- Modify: `apps/web/src/hooks/useMonthlyData.ts`
- Modify: `apps/web/src/app/App.tsx` (clase en el contenedor de la pagina)
- Modify: `apps/web/src/styles.css` (clase `.is-stale`)
- Test: `apps/web/src/hooks/useMonthlyData.test.ts`

**Interfaces:**
- Produces: `useMonthlyData(...)` devuelve ademas `stale: boolean`.

- [ ] **Step 1: Write the failing test**

Con `renderHook` y `globalThis.fetch` suplantado, tres casos:

```ts
it("conserva el mes anterior mientras llega el nuevo, y lo marca como viejo", async () => {
  const { result, rerender } = renderHook(({ month }) => useMonthlyData("t", "s", month, 0, "u"), {
    initialProps: { month: "2026-10" }
  });
  await waitFor(() => expect(result.current.movements).toHaveLength(1));

  rerender({ month: "2026-11" });
  expect(result.current.movements).toHaveLength(1);
  expect(result.current.stale).toBe(true);

  await waitFor(() => expect(result.current.stale).toBe(false));
});

it("vacia de verdad cuando el mes nuevo no trae nada", async () => {
  // el segundo mes responde []
  await waitFor(() => expect(result.current.movements).toHaveLength(0));
});

it("suelta los datos al cambiar de usuario", async () => {
  // rerender con otro userId deja movements en []
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/web -- useMonthlyData`
Expected: FAIL: hoy vacia al empezar la peticion y no expone `stale`.

- [ ] **Step 3: Conservar los datos y exponer `stale`**

Quitar el vaciado al iniciar la carga; marcar `stale` mientras hay peticion en vuelo con datos viejos en pantalla. Al llegar la respuesta se reemplaza siempre, aunque venga vacia. El vaciado al cambiar de `userId` **se queda**.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -w @ahorra/web -- useMonthlyData`
Expected: PASS

- [ ] **Step 5: Atenuar en pantalla**

En `App.tsx`, anadir `is-stale` al contenedor cuando `stale`. En CSS, `opacity: 0.55` con `transition: opacity 150ms var(--ease-out)`; el bloque de `prefers-reduced-motion` que ya existe apaga la transicion solo.

- [ ] **Step 6: Run the whole web suite**

Run: `npm run test -w @ahorra/web`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/hooks/useMonthlyData.ts apps/web/src/hooks/useMonthlyData.test.ts \n  apps/web/src/app/App.tsx apps/web/src/styles.css
git commit -m "feat(web): keep the previous month on screen while the new one loads"
```

---

### Task 6: Cada pestana recuerda donde estaba

**Files:**
- Create: `apps/web/src/app/viewMemory.ts`
- Modify: `apps/web/src/app/router.tsx` (`navigate` guarda y restaura)
- Modify: `apps/web/src/features/movements/MovementsPage.tsx` (filtros iniciales desde la memoria)
- Test: `apps/web/src/app/viewMemory.test.ts`

**Interfaces:**
- Produces: `rememberScroll(path: string, top: number): void`, `recallScroll(path: string): number`, `rememberFilters<T>(path: string, filters: T): void`, `recallFilters<T>(path: string, fallback: T): T`

- [ ] **Step 1: Write the failing test**

```ts
it("devuelve lo guardado por ruta y no mezcla rutas", () => {
  rememberScroll("/movimientos", 420);
  expect(recallScroll("/movimientos")).toBe(420);
  expect(recallScroll("/metas")).toBe(0);
});

it("devuelve el valor por defecto cuando no hay nada guardado", () => {
  expect(recallFilters("/movimientos", { type: "ALL" })).toEqual({ type: "ALL" });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -w @ahorra/web -- viewMemory`
Expected: FAIL, el modulo no existe.

- [ ] **Step 3: Implementar `viewMemory.ts`**

Dos `Map` a nivel de modulo, en memoria. No es persistencia: muere al recargar, que es lo que se quiere.

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -w @ahorra/web -- viewMemory`
Expected: PASS

- [ ] **Step 5: Conectarlo**

En `navigate()`, guardar el scroll de la ruta que se deja antes del `pushState`, y restaurar el de la ruta a la que se entra en vez del `scrollTop = 0` incondicional. En `MovementsPage`, arrancar los filtros con `recallFilters` y guardarlos cuando cambian.

- [ ] **Step 6: Run the whole web suite**

Run: `npm run test -w @ahorra/web`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add apps/web/src/app/viewMemory.ts apps/web/src/app/viewMemory.test.ts \n  apps/web/src/app/router.tsx apps/web/src/features/movements/MovementsPage.tsx
git commit -m "feat(web): remember scroll and filters per tab"
```
