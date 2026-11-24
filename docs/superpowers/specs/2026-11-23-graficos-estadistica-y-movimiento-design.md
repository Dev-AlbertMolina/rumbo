# Rumbo: graficos, estadistica y movimiento sin cortes

Documento de diseno. Vivo: se amplia segun avanza la conversacion.

Fecha: 2026-11-23 · Estado: en discusion

## Intencion

Rumbo ya registra bien el dinero. Lo que falta es que lo **explique**: que cada
pantalla conteste la pregunta con la que la persona entra, y que moverse por la
app se sienta continuo, sin tirones al abrir cosas.

El encargo, en palabras del dueno: mejoras reales, mejores graficos y
estadistica, y mejores adaptaciones de lo que ya esta. Para PC y para telefono.

## Objetivos

- Cada grafico contesta una pregunta y lo dice en su titulo.
- Un kit de graficos compartido: ejes, escala, tooltip y toque en movil se
  escriben una vez y los usan todos.
- Estadistica que hoy no existe: la dimension del tiempo, mas alla del mes.
- Movimiento continuo: sin saltos de fotograma al abrir paneles o avisos.
- Todo funciona igual de bien a 390 px que a 1440 px.

## No objetivos

- **Modo oscuro.** Descartado por el dueno en esta ronda.
- **Notificaciones push.** Siguen necesitando Firebase y APNs (ver
  `IDEAS_Y_PENDIENTES.md`).
- **Version de pago.** El bloqueo es cobrar en RD, no las funciones.
- **Compartir espacio, multi-moneda, importar del banco.** Descartadas antes y
  no se reabren aqui.

## Anti objetivos

Lo que convertiria esto en un fracaso aunque funcione:

- Graficos decorativos: si no contesta nada, sobra.
- Animacion que se note. El objetivo es que nadie la mencione, no que impresione.
- Que el telefono reciba una version recortada en vez de una adaptada.

## Restricciones

- **Despliegue serverless** en Vercel: no hay proceso vivo; las recurrencias se
  materializan al leer.
- **Supabase gratis**: el proyecto se pausa tras dias sin uso. Ya paso una vez,
  en septiembre, y tumbo el inicio de sesion.
- **El telefono manda**: la app se usa sobre todo dentro del APK, que carga la
  version publicada en Vercel.
- **La paleta es la de Rumbo**: ciruela, terracota y dorado sobre papel crema.
- `vercel.json` borra `package-lock.json` antes de instalar. No tocar.

## Hallazgo que cambia el alcance

`/api/movements` acepta `month` **opcional**: sin el, devuelve el historial
completo del espacio. La estadistica de varios meses no necesita endpoint nuevo,
al contrario de lo que decia el plan de septiembre. Si algun dia el historial
pesa demasiado, se le anade un rango de fechas.

## Estado medido hoy

Medido con los componentes reales en un banco de pruebas, a 1440 y 390 px:

| Momento | Peor fotograma | Saltos > 32 ms |
| --- | --- | --- |
| Abrir la hoja de movimiento (PC) | 153 ms | 2 |
| Mostrar un aviso (PC) | 69 ms | 6 |
| Cerrar la hoja | 21 ms | 0 |
| Scroll | 7 ms | 0 |

El scroll y las salidas van finos. Los tirones salen **al abrir**, cuando la
animacion arranca a la vez que React monta el contenido. Pendiente: repetir la
medida contra la version compilada, porque en desarrollo React monta cada
componente dos veces y puede estar inflando la cifra.

Graficos actuales: el del mes esta bien y responde al toque; los del Inicio
(barras y categorias) no responden ni al cursor ni al dedo, no tienen eje de
referencia, y en el telefono el del mes pierde 56 de 316 px en las etiquetas.

## Enfoques considerados

| Enfoque | Que da | Que cuesta |
| --- | --- | --- |
| **A. Exprimir lo que existe** | Kit de graficos compartido; cascada en Inicio, metas, deudas, quincenas, saldo corriente | Solo cliente. Riesgo bajo |
| **B. Abrir el tiempo** | Tendencias de 6-12 meses, saldo mes a mes, rachas | Solo cliente, gracias al hallazgo de arriba |
| **C. Funciones nuevas** | Simulador, resumen escrito, sobres, PDF | Producto nuevo, mas superficie y mas riesgo |

**Elegido: A, luego B, y del C solo el simulador.** A arregla la base y abarata
cada grafico que venga despues; B es la estadistica de verdad y ya no cuesta
servidor; C se queda fuera salvo el simulador. El movimiento sin cortes no es
una fase: va dentro de cada bloque.

## Alcance acordado, por dependencia

Cada bloque se apoya en el anterior. El orden no es por valor: es por lo que
hace falta tener antes para que lo siguiente salga barato.

### 0. Medir de verdad: HECHO, y la causa esta encontrada

No era el montaje doble de desarrollo. Midiendo tres aperturas seguidas:

| Apertura | Peor fotograma | Saltos > 32 ms |
| --- | --- | --- |
| Primera | 160 ms | 3 |
| Segunda | 21 ms | 0 |
| Tercera | 14 ms | 0 |

Es un coste de primera vez. Aislando el sospechoso con una regla inyectada en
caliente, sin tocar el codigo:

| Primera apertura | Peor fotograma |
| --- | --- |
| Con backdrop-filter | 146 ms |
| Sin backdrop-filter | 21 ms |

**El desenfoque del fondo de los dialogos cuesta 125 ms la primera vez** que el
navegador tiene que montar esa capa. Despues queda caliente y sale gratis, asi
que el tiron lo sufre justo quien abre la app y registra su primer gasto.

Decision: **quitar el desenfoque**. Es decorativo; el fondo oscurecido ya separa
las capas, y la skill de diseno visual desaconseja el cristal esmerilado
decorativo. La alternativa, calentarlo al arrancar con un elemento invisible,
esconde el coste en vez de quitarlo.

Queda por medir con el mismo metodo el aviso flotante, que cuesta 70 ms la
primera vez y probablemente paga su propia sombra.

### 1. Cimientos tecnicos

Van primero porque abaratan todo lo demas y porque cada grafico nuevo suma
peso a un paquete que ya pesa 541 KB.

- Partir el codigo por pantalla. Reportes, Novedades, Deudas y Metas se cargan
  al entrar.
- Arreglar el tiron al abrir paneles, segun lo que diga la medida del bloque 0.
- No vaciar la pantalla al cambiar de mes: lo anterior se queda atenuado.
- Recordar scroll y filtros de cada pestana.
- **Vigilante diario**: tarea programada gratuita en GitHub que toca la app y
  Supabase cada dia y avisa si no responden. Habria detectado la caida de
  septiembre el primer dia, y el ping evita que Supabase pause el proyecto por
  inactividad, que fue la causa raiz.
- **Mensaje honesto cuando el servicio no responde**. Hoy dice revisa los
  datos, que suena a contrasena mal escrita, cuando el servidor esta caido.
- **Dos pruebas de extremo a extremo** en CI: entrar y registrar un gasto, y
  cambiar de mes. Hoy no hay ninguna.

### 2. El kit de graficos

Todo lo visual que viene despues depende de esto. Una sola vez: escala, ejes,
rejilla, tooltip, toque en movil, foco de teclado, estado vacio y descripcion
para lectores de pantalla.

Regla de la casa, tomada de la skill de visualizacion: un grafico contesta una
pregunta y su titulo es la respuesta; nunca dos ejes verticales; color por
entidad, nunca por posicion; etiquetas directas antes que leyenda.

### 3. El historial

Un hook que pide los movimientos sin mes y los cachea. Es el prerequisito de
todo el bloque de tiempo. Si algun dia pesa demasiado, se le anade rango de
fechas a la API.

### 4. Inicio

- Cascada de ingresos a disponible en PC; barra apilada con la misma
  informacion en el telefono.
- Gasto fijo contra gasto variable, separando lo generado por reglas.
- Calendario del mes con el gasto de cada dia.
- Categorias con su porcentaje del total.

### 5. Las pantallas de siempre

- **Presupuesto**: cuanto queda por dia; copiar los limites del mes anterior;
  proponer limites desde el gasto real (necesita el bloque 3).
- **Metas**: llego a tiempo, lo ahorrado contra el ritmo necesario.
- **Deudas**: cuando terminas de pagar, y simulador de cuantos meses adelantas
  si abonas de mas. Solo en tiempo: no hay tasa de interes guardada.
- **Movimientos**: saldo corriente y total por dia; selector de mes con
  flechas y atajo a Hoy; deslizar para editar o borrar; galeria de recibos del
  mes.
- **Registro en dos toques**: monto, categoria y guardar, con mas detalles
  para el resto. Hoy el boton flotante abre siete campos para anotar un cafe,
  y es la accion mas repetida de la app.
- **Duplicar un movimiento** desde la lista, para lo repetido que no amerita
  una regla.
- **Buscar en todo el historial**, no solo en el mes cargado. Necesita el
  bloque 3.
- **Gastos fijos**: cuanto falta pagar de lo recurrente este mes.

### 6. Reportes y el tiempo

Todo esto necesita el bloque 3.

- Tendencia de 6 a 12 meses: ingresos, gastos y tasa de ahorro.
- Saldo mes a mes.
- Categorias que suben mes tras mes.
- Gasto por quincena y por dia de la semana.
- Mejor mes, rachas de meses ahorrando y racha de dias registrando.
- Resumen del mes escrito en palabras.
- Compartir el resumen como imagen desde el telefono.

### 7. Lo que cambia de forma la app

- **Negocio con cara propia**: entrada, salida y resultado del mes, comparado
  con el anterior. Hoy el espacio Negocio se ve igual que el Personal.
- **Personal contra Negocio** en una vista comparada.
- **Simulador**: puedo permitirme esto, sobre el disponible proyectado.

### 8. Entrar y salir con los datos propios

- **Primera vez guiada**: saldo inicial, primer ingreso y un limite. Hoy un
  usuario nuevo cae en un panel vacio.
- **Exportar todo** desde Configuracion, como copia de seguridad. Despues del
  susto de septiembre, que los datos puedan salir de la app importa.

## Referencias de otras apps

Leidas en sus paginas oficiales el 23-11-2026. Monarch y BudgetBakers no
respondieron (404), asi que Monarch se documento por su centro de ayuda.

| App | Que hace que valga la pena mirar |
| --- | --- |
| **Actual Budget** (libre) | El catalogo de informes mas completo sin banco conectado: flujo de caja, patrimonio en tendencia o apilado, analisis de gasto comparando periodos, tarjeta de calendario con ingreso y gasto por dia, tarjeta resumen con promedio mensual |
| **Copilot** (pago, iOS) | Vista dedicada de suscripciones y cargos recurrentes, con cuanto falta por pagar del mes; presupuesto propuesto a partir del gasto real; comparaciones en palabras frente al mes pasado |
| **YNAB** (pago) | Objetivos con progreso; calculadora de prestamo que dice cuanto tiempo e interes ahorra cada peso extra |
| **Monarch** (pago) | Diagrama Sankey del flujo del mes, bajo Reportes. Su propio centro de ayuda lo marca como solo web: no cabe en un telefono |
| **Wave** (negocios) | Informe de caja con entrada bruta, salida bruta y variacion neta, y comparacion mes a mes o ano a ano |
| **Monefy, Mobills** (LatAm) | Registro manual, graficos e informes por categoria. Confirman que el publico de Rumbo no espera conexion bancaria |

### Lo que se toma prestado (aprobado por el dueno, 23-11-2026)

1. **Gastos fijos con lo que falta pagar** del mes, al estilo de la vista de
   suscripciones de Copilot. Rumbo ya sabe el monto y la proxima fecha de cada
   regla, asi que la cifra es exacta.
2. **Presupuesto propuesto desde el gasto real**, no solo copiado del mes
   anterior. Copilot arranca asi y evita la pagina en blanco.
3. **Simulador de deuda**: cuantos meses antes terminas si pagas de mas. Como
   la calculadora de YNAB, pero solo en tiempo: Rumbo no guarda tasa de
   interes.
4. **Calendario del mes** con el gasto de cada dia, como la tarjeta de Actual.
   Cabe bien en un telefono y acompana al grafico de saldo diario.
5. **Tasa de ahorro a la vista** junto a ingresos y gastos, como el panel de
   flujo de Monarch.
6. **Resumen del mes en palabras**, al estilo de las comparaciones de Copilot.
   Sube desde el enfoque C porque con los datos de B ya casi esta escrito.
7. **Negocio: estado de resultados simple**, con entrada, salida y resultado
   del mes y su comparacion, como el informe de caja de Wave. Aplica al
   espacio Negocio, que hoy se ve igual que el Personal.

### Lo que no se copia

- **Conexion bancaria.** Es el centro de Copilot, Monarch, YNAB y Fintonic, y
  no aplica: Plaid no cubre Republica Dominicana y Rumbo es manual y funciona
  sin conexion a proposito.
- **Inversiones y patrimonio con activos.** Fuera del alcance de la app.
- **Asistente de IA y facturacion.** Ni el publico ni el momento.

### Lo que Rumbo tiene y ellos no

- **El san**, con su rueda de turnos. Ninguna de las apps revisadas lo contempla.
- **Funcionar sin conexion** con cola de subida, en una app de registro manual.
- **El ritmo de quincena** y el peso dominicano como moneda de origen, no como
  conversion.

### Decision de diseno que sale de aqui

Monarch mantiene su Sankey solo en web porque no cabe en un telefono. Rumbo
haria lo mismo con la cascada del Inicio: cascada completa en PC, y en el
telefono una barra apilada con la misma informacion, que es lo que si cabe.

## Comprobado durante el diseno

- **Renombrar una categoria no rompe nada.** Los movimientos apuntan al
  identificador, no al texto, asi que el cambio los arrastra. Era una sospecha
  y resulto infundada.
- **CI ya corre** tipos, lint, pruebas y compilacion con un Supabase local.
  Lo que falta son las pruebas de extremo a extremo.

## Respuestas del dueno (23-11-2026)

1. **El san no es gasto en las estadisticas.** Hoy una cuota se guarda como
   EXPENSE y un cobro de prestamo como INCOME (repository.ts, DEBT_CATEGORY).
   Ese dinero vuelve, asi que inflaba el gasto y hundia la tasa de ahorro. En
   los graficos, las cuotas de san y los abonos a deuda salen como
   **compromisos**, aparte del gasto corriente. El movimiento guardado no
   cambia: cambia como lo cuentan las estadisticas.
   **Tasa de ahorro = lo apartado a metas / ingresos.**
2. **Sin APK nuevo en esta ronda.** Compartir el resumen como imagen necesita
   complemento nativo; se aparca y se junta con otros para una ronda futura.
   Todo lo demas del plan llega por web, que es como se actualiza el APK hoy.
3. **Vigilante con ruta publica minima** que pregunta a la base si esta viva y
   responde si o no, sin datos de nadie. Nada de credenciales en GitHub.
4. **Negocio cambia solo Inicio y Reportes**, con entrada, salida y resultado.
   El menu y el resto de pantallas se quedan igual.
5. **Gratis ahora, cobrable despues.** Ver la seccion siguiente.

## Gratis ahora, cobrable despues

Decision del dueno: mientras sea version de prueba, **todo gratis para los
primeros usuarios, y para siempre**. Cuando se publique, algunas funciones
pasan a suscripcion **solo para quien llegue despues**.

Eso no se construye ahora, pero se deja preparado, porque separarlo despues
saldria caro:

- **Una sola puerta.** Una funcion que contesta si esta persona puede usar
  tal capacidad. Las pantallas preguntan por capacidad, nunca por plan. Hoy
  contesta que si a todo el mundo.
- **La fecha de corte no existe hoy, y la pone el dueno.** La puerta se
  construye vacia: sin fecha configurada, contesta que si a todo el mundo. El
  dia que el dueno diga desde hoy se cobra, se fija esa fecha y solo afecta a
  quien se registre despues. Todos los anteriores, incluidos los que lleguen
  mientras tanto, quedan libres para siempre.
- **Los fundadores salen de la fecha de alta.** Supabase ya guarda cuando se
  registro cada quien, y ese dato no se puede alterar desde la app. No hace
  falta tabla nueva, ni migracion, ni marcar a nadie a mano.
- **La fecha vive en la configuracion del servidor**, no dentro del codigo:
  ponerla es cambiar un valor, no reprogramar.
- **Cuando el cobro sea real, la puerta tiene que estar tambien en la API.**
  Lo que solo se comprueba en el navegador se puede saltar. Hoy da igual,
  porque todo esta abierto, pero queda anotado para no olvidarlo.
- **Candidatos al lado cobrable**, nada cerrado: el analisis de varios meses
  (bloque 6), la comparacion Personal contra Negocio, exportar todo y el
  resumen escrito del mes.
- **Siempre gratis**: registrar, el mes en curso, presupuesto, metas, deudas y
  el uso sin conexion. Lo que hace que la app sirva.
- **No se construye pasarela de pago.** El bloqueo sigue siendo cobrar desde
  Republica Dominicana, como ya dice IDEAS_Y_PENDIENTES.md.

## Decisiones tomadas por el constructor

Salen de la revision del documento. Van aqui para que el dueno pueda
corregirlas mientras lee, sin tener que contestarlas una por una.

1. **El historial vive en memoria durante la sesion** y mezcla la cola de
   subida pendiente, igual que ya hace el mes en useMonthlyData. Sin almacen
   nuevo en Dexie: si hiciera falta, se anade despues.
2. **Umbral del bloque 0**: ningun fotograma por encima de 32 ms en la primera
   apertura, medido con el banco de pruebas. Con eso el bloque se da por
   terminado.
3. **El banco de pruebas se queda**, pero solo en desarrollo: fuera de la
   compilacion y fuera de CI. Sirve para medir y para ver componentes que
   viven detras del inicio de sesion.
4. **Las categorias no estrenan paleta.** Un solo tono mas etiquetas directas,
   como hoy. El color se reserva para la direccion del dinero (entra, sale,
   se aparta), que es lo que ya significa en la app.
5. **El registro en dos toques rellena la descripcion** con el nombre de la
   categoria. No se toca el esquema ni la base.
6. **Novedades: una entrada por bloque**, no por item, y vista previa solo para
   lo que se ve de verdad.

## Lo que queda al constructor

- Como se reparte el kit en archivos.
- Si las tendencias se calculan en el dominio o en el cliente.
- El orden exacto de commits y despliegues.
