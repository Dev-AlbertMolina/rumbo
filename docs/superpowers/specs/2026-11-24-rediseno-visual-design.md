# Rumbo: rediseno visual

Documento de diseno. Pendiente de aprobacion del dueno.

Fecha: 2026-11-24 · Estado: propuesta

## Intencion

El dueno pide un cambio grande de diseno: color, interfaz, iconos de verdad
bonitos, "no tengas miedo en mover o cambiar nada", con permiso explicito para
decidir. Lo que sigue es la direccion que propongo, con lo que cuesta y lo que
se gana, para que la apruebe o la corrija antes de tocar nada.

La app ya funciona y ya es honesta. Lo que le falta es **tener cara propia**:
hoy se parece a lo que sale por defecto, y lo que hace no se parece a lo que
hace nadie.

## Objetivos

- Que Rumbo se reconozca de un vistazo, sin leer el nombre.
- Iconos con intencion: peso y relleno que signifiquen algo, no decoracion.
- Un sistema, no una colección de pantallas: color, tipografia, espacio y
  forma decididos una vez y usados en todas partes.
- Que el telefono mande, porque ahi se usa.
- Cero perdida de lo ganado: velocidad, uso sin conexion y accesibilidad se
  quedan como estan o mejor.

## No objetivos

- **Modo oscuro.** Descartado por el dueno en la ronda anterior. Si entra, es
  su propio proyecto, y el sistema de color que se propone aqui lo deja
  preparado.
- **Rehacer la arquitectura de pantallas.** El mapa de la app (Inicio,
  Movimientos, Presupuesto, Metas, Deudas, Reportes) no se toca aqui.
- **Ilustracion de marca a medida.** Caro y lento; se puede anadir despues.

## Anti objetivos

Lo que convertiria esto en un fracaso aunque se vea bonito:

- Que la app pase a parecerse a cualquier otra app de finanzas.
- Que el rediseno cueste velocidad: hoy el arranque son 494 KB y no puede
  subir.
- Que lo bonito tape lo legible: esto maneja el dinero de la gente.

## Estado actual, auditado

| Pieza | Como esta |
| --- | --- |
| Color | Ciruela #6b2948, terracota #a94725, dorado #e3a72f sobre papel #fff8f0. Mas estados: verde, rojo, ambar, violeta |
| Tipografia | Atkinson Hyperlegible para el texto, Fraunces 600 para titulares |
| Iconos | 44 iconos distintos de Lucide en 32 archivos, un solo peso, sin version rellena |
| Escala | 11 a 36 px en tokens, usada con disciplina: 42 usos de `--text-sm`, 17 de `--text-base` |
| Forma | Radios tokenizados, con una firma propia: la esquina inferior derecha recortada (`14px 14px 5px 14px`) |
| Movimiento | Resuelto en la ronda anterior: curva propia, salidas mas rapidas, sin desenfoques caros |

**Lo bueno, que no se toca:** la esquina recortada es una firma real y
reconocible. Atkinson Hyperlegible esta disenada para leerse y es una eleccion
acertada para cifras. El color por direccion del dinero (entra, sale, se
aparta) ya significa algo.

**Lo debil:** un solo peso de icono para 44 conceptos; Fraunces es la serif
reflejo de toda interfaz generada en los ultimos anos; el papel crema con
terracota es, exactamente, la combinacion que mas se repite en diseno hecho con
IA; y hay seis colores de estado compitiendo sin jerarquia.

## Lo que mide mal hoy

Medido con el validador de paletas de la skill de visualizacion, sobre los seis
colores que Rumbo usa como categorias (ciruela, terracota, dorado, verde, rojo,
violeta):

| Comprobacion | Resultado |
| --- | --- |
| Separacion para daltonismo | **FALLA**: rojo #b3263e y verde #267052 quedan a 5.5 de distancia (el minimo es 8) en deuteranopia |
| Croma minimo | **FALLA**: el verde #267052 tiene 0.088 de croma; se lee casi gris |
| Banda de luminosidad | **FALLA**: el ciruela #6b2948 queda fuera de la banda util como color de dato |
| Contraste contra la superficie | **AVISO**: el dorado #e3a72f da 2.08:1, por debajo de 3:1 |
| Separacion a ojo normal | PASA: ciruela y terracota quedan a 16.8 |

El primero no es teorico y no es menor. En Deudas, **el verde significa que te
deben y el rojo que debes**: para la forma mas comun de daltonismo, que afecta
a cerca de uno de cada doce hombres, esos dos estados se ven casi iguales. Hoy
lo salva que cada tarjeta lleva etiqueta de texto; el color, por si solo, miente.

Eso convierte la reconstruccion del color de "estaria bien" en "hay que
hacerlo", y da el criterio: la pareja debe/te deben tiene que separarse por
tono **y** por luminosidad, no solo por tono.

## El arreglo del color, ya validado

Probado contra el mismo validador hasta que paso:

| Papel | Hoy | Aplicado | Que cambia |
| --- | --- | --- | --- |
| Entra / te deben (marca) | #267052 | **#0f9c6e** | Mas claro y mas saturado: croma 0.088 -> 0.129, deja de leerse gris |
| Entra / te deben (texto) | #267052 | **#267052** | Se queda: 5.66:1. Ningun verde sirve a la vez de marca y de letra |
| Debes / peligro | #b3263e | **#a31f33** | Mas oscuro: 6.11:1 -> 7.12:1 y mas separado por luminosidad |

Resultado medido al implementarlo, y dos correcciones a lo que decia este
documento antes de hacerlo:

- El #3faa78 que proponia esta propuesta **no llega** al minimo de contraste de
  una marca: 2.76:1 contra el papel, por debajo de 3:1. Se cambio por #0f9c6e,
  que da 3.32:1 con mas croma todavia (0.129).
- El par que de verdad se confunde en Deudas **no es verde contra rojo**, es la
  barra verde contra la barra terracota: 8.7 para deuteranopia pero **7.0 para
  protanopia**, por debajo del minimo. Con el verde nuevo pasa a 19.5.

Y un hallazgo que cambia el enfoque: **ningun verde legible como texto
(4.5:1 o mas) se separa de un rojo legible** para deuteranopia; todos los
candidatos medidos quedan entre 4.2 y 7.5. En letra, el color no puede cargar
ese significado, y por eso cada tarjeta seguira llevando su palabra.

Dos notas que vienen con la propuesta:

- El verde claro sirve para **marcas** (barras, puntos, rellenos), no para
  texto: da 2.83:1 contra el papel. El texto en verde se queda con un tono
  oscuro aparte. Es la division normal entre color de dato y color de letra.
- **Ciruela y terracota no pueden ser dos categorias vecinas** en un grafico:
  miden 12.8 de separacion a ojo normal, por debajo de 15. Como colores de
  marca y de gasto van bien; como dos series del mismo grafico, no.

## Referencias, y una que se rechaza

La base de datos de la skill de UI recomienda para "personal finance tracker":
**cristal esmerilado mas modo oscuro OLED, azul de confianza y verde de
ganancia**. Se rechaza, y conviene dejar escrito por que: es la respuesta
promedio del sector, es lo que la skill de diseno distintivo marca como el
tell de interfaz generada, y el dueno ya descarto el modo oscuro. Seguirla
seria cambiar una cara propia a medias por una cara prestada.

De lo que si se toma:

| Fuente | Que se toma |
| --- | --- |
| **Phosphor Icons** | Seis pesos por icono, dibujados a mano y no engordados por formula, con version rellena y duotono. La pestana activa puede ir rellena y la inactiva en contorno: el peso pasa a significar estado |
| **Estilo papel/tinta** (base de datos) | Alto contraste sobre crema, sin adornos, legibilidad primero. Es el vecindario donde Rumbo ya vive |
| **Lexend** (base de datos) | Tipografia pensada para legibilidad, candidata para titulares frente a Fraunces |
| **Monarch, Copilot, Actual** (ronda anterior) | Jerarquia de informacion en pantallas de dinero: una respuesta por pantalla, cifra grande, detalle debajo |

## La direccion que propongo

### 1. Color: el mismo mundo, mejor construido

Mantener ciruela, terracota y dorado, y reconstruirlos en OKLCH para que las
escalas sean parejas de verdad y no a ojo. De ahi salen los tonos claros y
oscuros de cada color, con contraste comprobado, no estimado.

Reglas nuevas:

- **Un solo acento por pantalla.** Hoy compiten ciruela, terracota, dorado,
  verde, rojo, ambar y violeta. El color de estado se reserva para estados.
- **El color significa direccion**: entra, sale, se aparta. Nada mas.
- **El violeta de "informacion" desaparece**: no dice nada que el ciruela no
  diga.

### 2. Tipografia: la decision que necesita tu ojo

Atkinson Hyperlegible se queda para el texto y las cifras. Para los titulares,
tres caminos, y aqui mando una muestra para que elijas:

| Camino | Que gana | Que pierde |
| --- | --- | --- |
| **A. Quedarse con Fraunces** | Cero trabajo, ya la conoces | Sigue siendo la serif por defecto de lo generado con IA |
| **B. Lexend** | Legibilidad medida, sobria, cero riesgo | Menos personalidad: es correcta, no memorable |
| **C. Una serif con caracter** (Bricolage, Instrument, Gambetta) | Cara propia de verdad | Hay que mirarla con cifras al lado antes de casarse |

Mi recomendacion es **C**, con **B** como red de seguridad. Te lo enseno
montado sobre una pantalla real antes de decidir.

### 3. Iconos: de 44 dibujos a un sistema

Cambiar Lucide por **Phosphor**:

- Barra de navegacion: **relleno** para la pestana activa, **contorno** para
  las demas. Hoy el estado activo depende solo del color.
- Dinero que entra, sale o se aparta: el mismo icono en tres pesos, no tres
  dibujos distintos.
- Duotono reservado para lo que celebra: meta cumplida, deuda saldada.
- Tamanos en dos medidas y no en cinco: 18 px dentro del texto, 24 px en
  cabeceras y navegacion.

Coste real: 44 sustituciones, mecanicas, y revisar que ninguna cambie de
significado. El paquete no crece si se importan uno a uno.

### 4. Espacio y forma

- Una sola escala de 4 puntos, ya casi respetada, aplicada tambien a los
  huecos entre bloques.
- La esquina recortada deja de ser decoracion y pasa a ser **firma de
  superficie**: solo en paneles y tarjetas, nunca en botones ni campos.
- Menos cajas: hoy casi todo es tarjeta. La jerarquia la haran el aire y la
  tipografia.

### 5. Lo que se ve primero

El Inicio vuelve a disenarse alrededor de una sola pregunta —cuanto me queda y
si llego— con el resto subordinado. Es lo que ya decidimos en el plan de
graficos, llevado al plano visual.

## Como se haria, por fases

1. **Los tokens** (color en OKLCH, escala, formas) sin cambiar ni una pantalla.
   Al terminar, la app se ve igual pero sobre cimientos nuevos.
2. **Los iconos**: Phosphor, con peso y relleno con significado.
3. **La tipografia**, una vez elegido el camino.
4. **Pantalla por pantalla**, empezando por Inicio y Movimientos, que son las
   que se usan a diario.
5. **Repaso de accesibilidad y velocidad**: contraste medido, peso del paquete,
   fotogramas.

## Lo que necesito de ti

1. **La tipografia de titulares**: te mando una muestra con las tres opciones
   montadas sobre una pantalla real de Rumbo.
2. **Hasta donde llega el cambio**: refinar lo que hay (recomendado) o
   replantear de cero la identidad.
3. **Si el cambio de iconos entra en esta ronda** o va aparte, porque toca 32
   archivos.
