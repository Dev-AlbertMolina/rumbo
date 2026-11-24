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

- **El arranque no puede crecer.** Medido hoy sobre la compilación de
  producción: `dist/assets/index-*.js` = 497.869 bytes. Ninguna tarea puede
  dejarlo por encima de **500.000 bytes**. Se comprueba con
  `npm run build -w @ahorra/web` y `stat -c %s dist/assets/index-*.js`.
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
- [ ] **Paso 5: cambiar los dos colores** a `--success: #3faa78` y
  `--danger: #a31f33` en `styles.css` y en `DATA_COLORS`, y ajustar sus
  variantes `-bg` y `-border` para que sigan dando ≥ 4.5:1 con su texto.
- [ ] **Paso 6: verde oscuro aparte para texto.** `#3faa78` da 2.83:1 sobre
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

- [ ] **Paso 1: la prueba que falla** — recorrer `styles.css` y exigir que
  ninguna regla de componente use un hex literal: todo color sale de un token.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA, con la lista de literales.
- [ ] **Paso 3: sustituirlos** por tokens de rol; el violeta de información
  desaparece y pasa a ciruela.
- [ ] **Paso 4: verla pasar** y correr `npm test`.
- [ ] **Paso 5: commit** — `refactor(web): el color significa dirección del dinero`

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
- [ ] **Paso 3: instalar** `@fontsource-variable/newsreader@5.3.0`, importar
  solo el subconjunto latino, y definir `--font-display`.
- [ ] **Paso 4: `font-display: swap`** y comprobar que el salto de Georgia a
  Newsreader no mueve el contenido: misma altura de línea en los dos.
- [ ] **Paso 5: medir** el arranque otra vez y el peso de la fuente.
  Esperado: índice por debajo de 500.000 bytes; la fuente es un archivo aparte.
- [ ] **Paso 6: commit** — `feat(web): titulares en Newsreader`

### Tarea 5: Espacio, forma y menos cajas

**Archivos:**
- Modificar: `apps/web/src/styles.css`
- Crear: `apps/web/src/styles.shape.test.ts`

- [ ] **Paso 1: la prueba que falla** — la esquina recortada
  (`--radius-signature`) solo aparece en paneles y tarjetas, nunca en botones
  ni campos; y todos los huecos salen de la escala de 4.
- [ ] **Paso 2: verla fallar** — Esperado: FALLA con la lista de excepciones.
- [ ] **Paso 3: corregirlas**, y quitar la tarjeta de lo que no necesita
  tarjeta: la jerarquía la hacen el aire y la tipografía.
- [ ] **Paso 4: anillo de foco visible** sobre papel en todo lo que se pueda
  enfocar, con prueba de contraste ≥ 3:1 contra su fondo.
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
