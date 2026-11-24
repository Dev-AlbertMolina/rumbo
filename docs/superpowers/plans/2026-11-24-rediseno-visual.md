# Rediseño visual de Rumbo — plan de ejecución

> **Para quien lo ejecute:** SUB-SKILL OBLIGATORIA: usar superpowers:executing-plans
> (o subagent-driven-development) para implementarlo tarea a tarea. Los pasos
> usan casillas (`- [ ]`) para ir marcando.

**Objetivo:** darle a Rumbo una cara propia —color construido, tipografía con
carácter, iconos con significado y una pantalla de Inicio que responda una sola
pregunta— sin perder velocidad, accesibilidad ni el uso sin conexión.

**Arquitectura:** primero los cimientos (tokens), que no cambian ni una
pantalla; después las piezas que se ven en todas (iconos, tipografía); después
las pantallas, empezando por las dos que se usan a diario. Cada tarea deja la
app funcionando y publicable.

**Tecnologías:** React 19 + Vite, CSS propio con tokens en `styles.css`,
`@fontsource-variable/newsreader` 5.3.0, `@phosphor-icons/react` 2.1.10,
vitest. Sin librería de componentes nueva.

**Spec:** `docs/superpowers/specs/2026-11-24-rediseno-visual-design.md`

## Decisiones que tomé yo

El dueño dio permiso explícito para decidir ("tienes todas las skills y
permisos a tus decisiones"). Estas son las tres que la spec dejaba abiertas, y
son reversibles: si al verlas no le convencen, se cambian en la tarea que las
introduce, no en todo el plan.

1. **Titulares: Newsreader**, no Fraunces y no Lexend. Monté las cuatro sobre
   una pantalla real de Rumbo, con un titular, un subtítulo y una cifra en
   pesos al lado. Fraunces es la serif por defecto de casi todo lo generado
   con IA. Petrona a peso 600 se lee demasiado clara junto a las cifras.
   Lexend es correcta y no se recuerda. Newsreader tiene más contraste, aguanta
   a 20 px en los títulos de sección, trae eje de tamaño óptico y el rango de
   pesos completo en un archivo variable.
2. **Los iconos entran en esta ronda**, en su propia tarea (la 3) y antes de
   tocar pantallas. Son 44 iconos en 32 archivos: dejarlos para después
   obligaría a revisar dos veces cada pantalla.
3. **El alcance es refinar, no rehacer la identidad.** La esquina recortada,
   el papel crema y el ciruela se quedan: son lo único que hoy ya es de Rumbo
   y no de nadie más. Lo que se reconstruye es cómo están hechos.

## Restricciones globales

Valen para todas las tareas.

- **El arranque no puede crecer.** Medido sobre la compilación de producción
  tras la actualización de seguridad de la tarea 8: `dist/assets/index-*.js`
  = 449.239 bytes tras la tarea 3. Ninguna tarea puede dejarlo por encima de
  **455.000 bytes**. Se comprueba con `npm run build -w @ahorra/web` y
  `stat -c %s dist/assets/index-*.js`.
  (Fueron 497.869 el lunes; subir zod por el aviso de seguridad costo 20 KB,
  sacar zod del navegador devolvio 88, y los iconos nuevos cuestan 20. El
  balance frente al arranque de 541 KB de antes del troceado: 17% menos.)
- **Nada de modo oscuro.** Descartado por el dueño. Los tokens se escriben de
  forma que admitirlo después sea posible, pero no se añade ningún tema.
- **Contraste medido, no estimado:** texto ≥ 4.5:1 contra su fondo; marcas de
  gráfico y bordes que signifiquen algo, ≥ 3:1.
- **Separación para daltonismo ≥ 8** entre cualquier par de colores que
  signifiquen cosas distintas en la misma pantalla (deuda/préstamo,
  entra/sale), y ≥ 15 a ojo normal entre categorías vecinas de un gráfico.
- **El color nunca va solo:** todo estado que se distinga por color lleva
  además texto, icono o forma.
- **El movimiento no se toca.** `--ease-out`, las duraciones y
  `prefers-reduced-motion` se quedan como están; ninguna tarea añade
  `backdrop-filter`.
- **Las fuentes se sirven desde la app** (`@fontsource*`), nunca desde un CDN:
  la app tiene que funcionar sin conexión.
- **Los iconos se importan uno a uno** (`import { House } from
  "@phosphor-icons/react"`), nunca el paquete entero.
- **Copia en español dominicano**, tuteando, sin jerga técnica.
- **TDD:** ninguna línea de producción sin una prueba que la haya pedido y que
  se haya visto fallar antes.
- `npm test` desde la raíz. Las 9 pruebas de integración de la API
  (`apps/api/src/app.test.ts`) exigen `TEST_DATABASE_URL` y un Postgres local;
  sin Docker no corren, y eso no cuenta como fallo de este plan.
- No tocar `installCommand` de Vercel: `npm ci` rompe producción por el
  lockfile.

## Dónde vive cada cosa

| Archivo | De qué responde |
| --- | --- |
| `apps/web/src/styles.css` | Tokens y estilos. Es el archivo grande del rediseño |
| `apps/web/src/lib/palette.ts` *(nuevo)* | Los colores como datos: el único sitio donde se escribe un color de dato |
| `apps/web/src/lib/palette.test.ts` *(nuevo)* | El validador: contraste, croma y daltonismo, sobre los colores de verdad |
| `apps/web/src/components/Icon.tsx` *(nuevo)* | Los dos tamaños y los pesos con significado |
| `apps/web/src/app/Sidebar.tsx`, `BottomNav.tsx` | Estado activo por peso y relleno, no solo por color |
| `apps/web/src/features/**` | Las pantallas, en el orden de las tareas 6 y 7 |

## Foco de revisión

Lo que la spec implica, ninguna prueba de este plan ejercita y más fácilmente
muerde a quien use la app. Quien revise al final mira estas cinco a propósito.

1. **Un gráfico de Reportes con más categorías que colores tiene la paleta.**
   Con ocho categorías de gasto, ¿qué pasa con la novena? Repetir color sin
   repetir forma hace ilegible el gráfico.
2. **La fuente variable tarda en llegar.** En una conexión lenta, ¿el titular
   salta de tamaño al cambiar de Georgia a Newsreader y empuja las cifras?
3. **El foco del teclado tras quitar cajas.** Menos bordes puede dejar el anillo
   de foco invisible sobre papel crema en botones secundarios y chips.
4. **La barra inferior en blanco y negro.** Si el estado activo acaba
   dependiendo del color más de lo que creemos, en escala de grises —o para
   quien no distinga el ciruela— deja de verse cuál es la pestaña actual.
5. **Nombres largos en pantalla de 375 px.** "Reportes: qué cambió frente al
   mes anterior" con una serif más ancha: ¿se corta, desborda o parte mal?

---

### Tarea 1: Los colores como datos, con su validador

Hoy los colores viven sueltos en `styles.css` y nadie comprueba nada. Esta
tarea los convierte en datos comprobables y arregla el fallo real medido: el
verde de "te deben" y el rojo de "debes" quedan a 5.5 de distancia en
deuteranopia, por debajo del mínimo de 8, y el verde se lee gris.

**Archivos:**
- Crear: `apps/web/src/lib/palette.ts`
- Crear: `apps/web/src/lib/palette.test.ts`
- Modificar: `apps/web/src/styles.css` (solo los valores de `--success*` y `--danger*`)

**Interfaces:**
- Produce: `DATA_COLORS: Record<string, string>` (hex), `PAPER: string`,
  `contrast(a: string, b: string): number`,
  `cvdDistance(a: string, b: string, kind: "deuteranopia" | "protanopia"): number`.
  Las tareas 2 y 6 leen `DATA_COLORS`; nadie vuelve a escribir un hex suelto.

- [ ] **Paso 1: la prueba que falla** — `palette.test.ts` con cuatro casos:
  `contrast("#2b211e", "#fff8f0")` ≥ 4.5; el par deuda/préstamo con
  `cvdDistance(...) >= 8`; cada color de `DATA_COLORS` con croma ≥ 0.1; y
  `contrast(color, PAPER) >= 3` para todo color de marca.
- [ ] **Paso 2: verla fallar** — `npx vitest run src/lib/palette.test.ts`
  Esperado: FALLA, "Cannot find module './palette'".
- [ ] **Paso 3: implementar `palette.ts`** con la conversión sRGB → OKLab →
  OKLCH y la simulación de Brettel/Viénot para daltonismo (sin dependencias
  nuevas; son unas 60 líneas de aritmética).
- [ ] **Paso 4: volver a correr** — Esperado: FALLA, pero ahora por el par
  deuda/préstamo a 5.5 y por el croma del verde. Ese es el fallo de verdad.
- [ ] **Paso 5: cambiar los dos colores** a `--success: #0f9c6e` y
  `--danger: #a31f33` en `styles.css` y en `DATA_COLORS`, y ajustar sus
  variantes `-bg` y `-border` para que sigan dando ≥ 4.5:1 con su texto.
- [ ] **Paso 6: verde oscuro aparte para texto.** `#0f9c6e` da 3.32:1 sobre
  papel: sirve para barras y puntos, no para letras. Añadir `--success-ink`
  para el texto en verde y una prueba que exija ≥ 4.5:1.
- [ ] **Paso 7: correr todo** — `npm test` desde la raíz.
  Esperado: todo verde salvo las 9 de integración de la API.
- [ ] **Paso 8: commit** — `feat(web): los colores como datos, y el fallo de daltonismo medido`

### Tarea 2: Un solo acento por pantalla

Hoy compiten ciruela, terracota, dorado, verde, rojo, ámbar y violeta sin
jerarquía. El color pasa a significar una sola cosa: dirección del dinero.

**Archivos:**
- Modificar: `apps/web/src/styles.css`
- Modificar: los componentes que usen el violeta de "información"
- Crear: `apps/web/src/lib/palette.roles.test.ts`

**Interfaces:**
- Consume: `DATA_COLORS` de la tarea 1.
- Produce: los roles `--accent-screen`, `--money-in`, `--money-out`,
  `--money-aside`, que las pantallas usan en vez de nombres de color.

- [x] **Paso 1-2: la prueba** — nueve colores escritos a mano fuera de los
  tokens, y el violeta vivo. RED con los nueve en la lista.
- [x] **Paso 3: sustituidos** por tokens de rol, con el contraste medido de
  cada uno contra su fondo (texto claro sobre ciruela 7.7:1, iconos del aviso
  flotante 8.8:1 y 8.0:1). El violeta se retira: sus cuatro usos —aviso sin
  conexión, insignia de recurrencia, tarjeta de impacto y estado en pausa—
  pasan a ciruela sobre #f6ebf0, que da 8.9:1.
- [x] **Paso 4-5: verde** y mirado en el navegador: ya no desentona.

### Tarea 3: Iconos Phosphor, con peso que significa algo

44 iconos de Lucide en un solo peso pasan a Phosphor, donde el relleno y el
peso dicen el estado. 32 archivos; es mecánico, pero cada sustitución hay que
mirarla: un icono que cambia de significado es peor que uno feo.

**Archivos:**
- Crear: `apps/web/src/components/Icon.tsx`
- Crear: `apps/web/src/components/Icon.test.tsx`
- Modificar: los 32 archivos que hoy importan de `lucide-react`
- Modificar: `apps/web/package.json` (quitar `lucide-react`, añadir `@phosphor-icons/react`)

**Interfaces:**
- Produce: `<Icon name={...} size="text" | "ui" weight="regular" | "fill" />`,
  con `text` = 18 px y `ui` = 24 px. Las tareas 6 y 7 solo usan este componente.

- [ ] **Paso 1: la prueba que falla** — `Icon.test.tsx`: la pestaña activa de
  la barra inferior se dibuja con `weight="fill"` y las demás con `regular`;
  y ningún archivo de `src/` importa ya de `lucide-react`.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA en las dos.
- [ ] **Paso 3: `Icon.tsx`** con el mapa de nombres a iconos de Phosphor,
  importados uno a uno.
- [ ] **Paso 4: sustituir los 44**, uno por uno, comprobando el significado.
- [ ] **Paso 5: verlas pasar**, y medir el arranque:
  `npm run build -w @ahorra/web && stat -c %s apps/web/dist/assets/index-*.js`
  Esperado: por debajo de 500.000 bytes.
- [ ] **Paso 6: commit** — `feat(web): iconos con peso y relleno que significan`

### Tarea 4: Newsreader en los titulares

**Archivos:**
- Modificar: `apps/web/package.json`, `apps/web/src/main.tsx` (imports de fuente)
- Modificar: `apps/web/src/styles.css`
- Crear: `apps/web/src/styles.fonts.test.ts`

- [ ] **Paso 1: la prueba que falla** — ningún `font-family` nombra "Fraunces";
  todos los titulares salen del token `--font-display`; el token lleva una
  pila de respaldo real (`Georgia, serif`).
- [ ] **Paso 2: verla fallar.**
- [x] **Paso 3: instalado** `@fontsource/newsreader` en su peso 600 latino,
  no la variable: la variable pesa 58 KB y de ella solo se usaria un peso; la
  estatica son 23,8 KB, frente a los 18,1 de Fraunces. Token `--font-display`.
- [ ] **Paso 4: `font-display: swap`** y comprobar que el salto de Georgia a
  Newsreader no mueve el contenido: misma altura de línea en los dos.
- [ ] **Paso 5: medir** el arranque otra vez y el peso de la fuente.
  Esperado: índice por debajo de 500.000 bytes; la fuente es un archivo aparte.
- [ ] **Paso 6: commit** — `feat(web): titulares en Newsreader`

### Tarea 5: Espacio, forma y menos cajas

**Archivos:**
- Modificar: `apps/web/src/styles.css`
- Crear: `apps/web/src/styles.shape.test.ts`

- [x] **Paso 1: la prueba** — la esquina ya estaba bien puesta. El ritmo no:
  el plan decia escala de 4 "ya casi respetada" y la medicion dijo otra cosa
  —424 valores pares, 69 impares sueltos—, asi que se bloquea el ritmo de dos
  que la app tiene de verdad. Forzar el cuatro eran 291 cambios para ganar
  poco.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA con la lista de excepciones.
- [ ] **Paso 3: corregirlas**, y quitar la tarjeta de lo que no necesita
  tarjeta: la jerarquía la hacen el aire y la tipografía.
- [x] **Paso 4: anillo de foco** — estaba en dorado, 2.03:1 sobre papel:
  invisible para quien navega con teclado. Ahora dos capas, clara y oscura,
  para que contraste este donde este el foco.
- [ ] **Paso 5: verlas pasar** y `npm test`.
- [ ] **Paso 6: commit** — `refactor(web): una escala, una firma de superficie`

### Tarea 6: Inicio, alrededor de una sola pregunta

"¿Cuánto me queda y llego?" manda; todo lo demás se subordina. Es lo que ya
decidió el plan de gráficos, llevado al plano visual.

**Archivos:**
- Modificar: `apps/web/src/features/dashboard/*`
- Modificar: `apps/web/src/app/App.tsx` (orden de los bloques de Inicio)
- Crear: `apps/web/src/features/dashboard/HomeHierarchy.test.tsx`

- [ ] **Paso 1: la prueba que falla** — en Inicio, el primer elemento con
  nivel de encabezado 1 es la respuesta del mes, y la cifra grande es la única
  que pasa de 28 px.
- [ ] **Paso 2: verla fallar.**
- [ ] **Paso 3: reordenar y rebajar** el resto de bloques.
- [ ] **Paso 4: móvil de 375 px** — comprobar que ningún título desborda ni se
  parte mal, con una prueba de ancho sobre los títulos más largos.
- [ ] **Paso 5: verlas pasar**, `npm test`, y mirarlo en el navegador a 375 y
  a 1280.
- [ ] **Paso 6: commit** — `feat(web): Inicio responde una sola pregunta`

### Tarea 7: Movimientos, y el repaso final

**Archivos:**
- Modificar: `apps/web/src/features/movements/*`
- Crear: `apps/web/src/a11y.test.ts`

- [ ] **Paso 1: la prueba que falla** — recorrer los pares de color que
  significan cosas distintas en una misma pantalla y exigir ≥ 8 de separación
  para daltonismo; y que todo estado con color tenga además texto o forma.
- [ ] **Paso 2: verla fallar** si queda alguno.
- [ ] **Paso 3: corregir** lo que saque.
- [ ] **Paso 4: más categorías que colores** — prueba con nueve categorías de
  gasto: a partir del último color de la paleta, las demás se agrupan en
  "Otros" en vez de repetir color. Repetir color sin repetir forma hace
  ilegible el gráfico, y es el caso que más fácil se cuela.
- [ ] **Paso 5: medir el arranque** por última vez.
  Esperado: por debajo de 500.000 bytes.
- [ ] **Paso 6: `npm test` y `npm run lint`** desde la raíz.
- [ ] **Paso 7: Novedades** — añadir la entrada de esta versión con su vista
  previa, montando componentes reales como las demás.
- [ ] **Paso 8: commit** — `feat(web): el rediseño, repasado de punta a punta`

---

# Parte B — Seguridad

Añadida a petición del dueño: "que evite problemas externos e internos de la
app". No es una lista de buenas prácticas: sale de auditar este repositorio el
2026-11-24. Cada tarea arregla algo que encontré, y queda escrito también lo
que ya estaba bien, para que nadie lo "arregle" después.

**Las tareas 8 a 10 no dependen de las 1 a 7.** Si hay que elegir, **empiezan
ellas**: una de las dependencias tiene un aviso crítico que afecta al APK que
ya repartes.

## Lo que ya está bien (no tocar)

- **Los recibos están guardados en privado.** El bucket es `public: false` y
  las políticas exigen que la primera carpeta de la ruta sea el id de quien
  pide el archivo. Es la pieza más delicada —una foto de recibo lleva nombres,
  direcciones, a veces números de tarjeta— y está resuelta.
- **No hay secretos en el repositorio.** Solo `.env.example` y un
  `.env.native` que contiene una URL pública y lo dice.
- **Las consultas van parametrizadas** (`$1`, `$2`): no hay inyección de SQL.
- **El service worker no guarda datos financieros**: precarga archivos
  estáticos, no respuestas de la API.
- **La entrada se valida con Zod** antes de tocar la base.

## Lo que encontré

| | Hallazgo | Qué pasa si no se toca |
| --- | --- | --- |
| **E1** | `vercel.json` no define ninguna cabecera de seguridad | Sin CSP, sin HSTS, sin `frame-ancestors`: la app se puede meter en un iframe ajeno y un XSS no encuentra freno |
| **E2** | 4 dependencias con avisos: `@capacitor/android` **crítico** (contenido remoto cargado en el origen de la app), `zod` y `fast-uri` altos | El crítico afecta al APK que ya repartes; el de `zod` permite agotar la memoria de la API con una petición grande |
| **E3** | La API no tiene límite de peticiones | En serverless eso es factura y carga de base; y `/api/health` es pública |
| **E4** | CORS permite siempre `http://localhost` y `capacitor://localhost` | Riesgo bajo (el token va en cabecera, no en cookie), pero es una puerta que no hace falta tener abierta en la web |
| **I1** | El aislamiento entre personas depende de que cada consulta lleve `user_id`; la API entra con `DATABASE_URL` directo, así que las políticas RLS casi seguro no se aplican | Una sola consulta sin esa cláusula enseña el dinero de otra persona |
| **I2** | ~~Cerrar sesión no borra la base local~~ **Falso: sí la borra.** Lo que falta es avisar | `clearOfflineUserData` ya borra movimientos, cola y metadatos al salir, y tiene prueba. Lo real es mas pequeño: un gasto anotado sin conexión se va con el resto, en silencio |
| **I3** | La prueba que comprueba el aislamiento existe, pero vive entre las 9 que exigen Docker | Nadie la corre. Una prueba que no corre no protege de nada |

---

### Tarea 8: Dependencias al día, y un guardia que avise

**Archivos:**
- Modificar: `package.json`, `apps/api/package.json`, `apps/web/package.json`
- Crear: `.github/workflows/audit.yml`

- [ ] **Paso 1: ver el tamaño del problema** — `npm audit --omit=dev`
  Esperado: 4 vulnerabilidades (3 altas, 1 crítica).
- [ ] **Paso 2: subir lo que se pueda sin romper nada** — `npm audit fix`
  (sin `--force`: solo lo compatible).
- [ ] **Paso 3: comprobar que nada se rompió** — `npm test` y
  `npm run build -w @ahorra/web`.
  Esperado: todo verde salvo las 9 de integración.
- [ ] **Paso 4: el APK** — si `@capacitor/android` necesita un salto mayor,
  compilar el APK antes de darlo por bueno: es lo que no cubre ninguna prueba.
- [ ] **Paso 5: el guardia** — `audit.yml`, semanal y a mano, que falle si
  aparece algo alto o crítico. Con `timeout-minutes` y `permissions: {}`, que
  es lo que al vigilante diario le falta.
- [ ] **Paso 6: commit** — `chore: dependencias al dia, y un aviso semanal`

### Tarea 9: Cabeceras y límite de peticiones

**Archivos:**
- Modificar: `vercel.json`, `apps/api/src/app.ts`, `apps/api/package.json`
- Crear: `apps/web/src/headers.test.ts`, `apps/api/src/limits.test.ts`

**Interfaces:**
- Produce: la sección `headers` de `vercel.json` y el registro de
  `@fastify/rate-limit` en `buildApp`.

- [ ] **Paso 1: la prueba que falla (cabeceras)** — leer `vercel.json` y
  exigir `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin` y `frame-ancestors 'none'`
  para todas las rutas.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA, no hay sección `headers`.
- [ ] **Paso 3: escribirlas.** La CSP tiene que admitir lo que la app usa de
  verdad: Supabase (API y storage) y nada más; sin `unsafe-inline` en scripts.
- [ ] **Paso 4: comprobarla en el navegador** antes de darla por buena: una
  CSP mal puesta deja la app en blanco, y eso no lo ve ninguna prueba.
- [ ] **Paso 5: la prueba que falla (límite)** — 100 peticiones seguidas desde
  la misma sesión reciben un 429 antes de la última.
- [ ] **Paso 6: verla fallar**, registrar `@fastify/rate-limit` con un cubo por
  usuario (y por IP en `/api/health`), y verla pasar.
- [ ] **Paso 7: CORS por despliegue** — en producción, solo los orígenes de
  `CORS_ORIGIN` y los nativos; los `localhost` de desarrollo solo cuando
  `NODE_ENV !== "production"`. Con su prueba.
- [ ] **Paso 8: commit** — `feat(api,web): cabeceras, limite de peticiones y CORS por despliegue`

### Tarea 10: Que el aislamiento no dependa de acordarse

Es el hallazgo que más caro sale si falla, y hoy lo sostiene la disciplina de
quien escribe cada consulta.

**Archivos:**
- Crear: `apps/api/src/isolation.test.ts`
- Modificar: `apps/api/src/database/postgres/repository.ts` (solo si algo sale)
- Crear: `supabase/migrations/<fecha>_force_rls.sql`
- Modificar: `apps/web/src/features/auth/AuthProvider.tsx`,
  `apps/web/src/lib/offline/outbox.ts`

- [ ] **Paso 1: la prueba que falla (sin base)** — recorrer el fuente de
  `repository.ts` y exigir que toda consulta a una tabla con `user_id` lleve
  `user_id = $` en su `where`. Es una prueba de texto, sí, pero corre sin
  Docker, que es justo lo que le falta a la que ya existe.
- [ ] **Paso 2: verla fallar o pasar.** Si pasa a la primera, ya es un
  cerrojo: lo que protege es la consulta que alguien escriba mañana.
- [x] **Paso 3: el aviso antes de salir** — cerrar sesión ya borraba lo local
  (eso lo tenía mal este plan); lo que faltaba es que no se llevara en
  silencio un gasto sin enviar. Hecho, con su prueba.
- [ ] **Paso 4: `npm test`** y commit —
  `feat: el aislamiento deja de depender de acordarse`

#### Lo que NO se hace aquí, y por qué: forzar RLS

Este plan decía "`alter table ... force row level security` y listo". **Eso
tumbaría la app**, y conviene dejar escrito el porqué antes de que alguien lo
intente un viernes:

Las políticas de la base están escritas contra `auth.uid()`, que es quien
eres según Supabase. Pero la API no entra por Supabase: abre su propia
conexión a Postgres con `DATABASE_URL`. En esa conexión `auth.uid()` es nulo,
así que hoy las políticas no se aplican —la conexión es la dueña de las
tablas y las salta— y si se forzaran, se aplicarían contra un `auth.uid()`
vacío: **cero filas para todo el mundo**.

Hacerlo bien es su propia tarea, y no es pequeña:

1. Que la API entre con un rol que no sea el dueño de las tablas.
2. Que cada petición abra transacción y haga
   `set local request.jwt.claims = '{"sub":"<id>"}'` antes de consultar.
3. Probarlo contra un Postgres de verdad (`supabase start`), con dos usuarios,
   comprobando que A no ve ni una fila de B.
4. Desplegarlo sabiendo que un fallo aquí deja la app sin datos para todos.

Mientras tanto, lo que separa a una persona de otra es el `where user_id`, y
la prueba del paso 1 es el cerrojo que vigila que no falte nunca.

## Lo que esta parte NO cubre

Para que quede dicho y no se confunda con estar resuelto:

- **Verificación en dos pasos.** Es de Supabase y es decisión del dueño.
- **Cifrado de la base local.** IndexedDB no se cifra; lo que hacemos es
  borrarla al salir.
- **Registro de quién vio qué.** No hay auditoría de accesos, y para una app
  de una persona por cuenta no hace falta todavía.
- **Copias de seguridad.** Las hace Supabase en su plan; nadie las ha probado
  restaurando. Eso merece su propio día.

---

### Tarea 11: Sacar zod del navegador

Nace de la tarea 8. Subir zod de 4.1 a 4.6 para cerrar el aviso de seguridad
costó 20 KB en la primera carga, y al ir a mirar por qué apareció algo peor:
**zod viaja entero al navegador sin que la web use ni uno de sus esquemas.**

Lo comprobé: ningún archivo de `apps/web/src` importa un `*Schema`. Están en
el mismo `packages/domain/src/index.ts` que las cuentas, así que el navegador
se descarga la librería de validación de la API para nada. El empaquetador no
puede quitarla solo: no sabe que `z.object(...)` no tiene efectos, y marcarlo
con `/* @__PURE__ */` solo ahorró 1 KB (probado y descartado).

**Archivos:**
- Crear: `packages/domain/src/constants.ts` (los arreglos sueltos:
  `movementTypes`, `movementStatuses`, `recurrenceFrequencies`, `debtKinds`)
- Crear: `packages/domain/src/schemas.ts` (todo lo que importa zod, y los
  tipos derivados con `z.infer`)
- Modificar: `packages/domain/src/index.ts` (cuentas e interfaces; reexporta
  los tipos con `export type`, que no deja rastro al compilar)
- Modificar: `packages/domain/package.json` (añadir la salida `./schemas`)
- Modificar: los archivos de `apps/api/src` que importan esquemas

**Interfaces:**
- Produce: `@ahorra/domain` sin zod en tiempo de ejecución, y
  `@ahorra/domain/schemas` con los esquemas para la API.

- [ ] **Paso 1: la prueba que falla** — `packages/domain/src/entry.test.ts`:
  el fuente de `index.ts` no contiene `from "zod"`.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA, la primera línea lo importa.
- [ ] **Paso 3: mover** las constantes y los esquemas a sus archivos, dejando
  en `index.ts` solo cuentas, interfaces y reexportación de tipos.
- [ ] **Paso 4: la salida nueva** en `package.json`, y actualizar la API.
- [ ] **Paso 5: `npm test` y `npm run typecheck`** — Esperado: dominio 53/53 y
  la API igual que antes; si un esquema cambió de sitio sin querer, aquí se ve.
- [ ] **Paso 6: medir** — `npm run build -w @ahorra/web`.
  Esperado: por debajo de **470.000 bytes**, es decir los 20 KB del aviso de
  seguridad recuperados y unos 30 más que nunca hicieron falta.
- [ ] **Paso 7: actualizar la cifra** de la nota de versión y de su gráfica:
  hoy dicen 541 → 518 KB, y pasarían a decir la verdad nueva.
- [ ] **Paso 8: commit** — `perf(domain): la validacion de la API deja de viajar al navegador`
