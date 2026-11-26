export interface ReleaseEntry {
  title: string;
  /** Que cambio, en una o dos frases y sin jerga. */
  description: string;
  /** Donde encontrarlo dentro de la app. */
  where?: string;
  /**
   * Si esta entrada se ensena con una vista previa.
   *
   * La vista previa vive en `releasePreviews.tsx`, emparejada por titulo, para
   * que las pantallas que retrata no viajen en la descarga inicial. Declararlo
   * aqui es lo que permite notar una correspondencia rota por los dos lados.
   */
  hasPreview?: true;
}

export interface Release {
  version: string;
  /** Fecha de publicacion, en formato ISO. */
  date: string;
  title: string;
  summary: string;
  entries: ReleaseEntry[];
}

/**
 * Historial de novedades.
 *
 * Es la unica fuente: de aqui salen tanto la pantalla de Novedades como el
 * aviso que aparece solo durante los primeros dias tras publicar. Tener la
 * fecha aqui evita el error de actualizar el texto y olvidar la fecha, que
 * dejaria el aviso sin aparecer.
 *
 * Lo mas nuevo va primero.
 */
export const RELEASES: Release[] = [
  {
    version: "1.1",
    date: "2026-11-26",
    title: "Se ve mejor, y te dice si llegas",
    summary:
      "Inicio deja de ser un tablero de cifras y contesta una pregunta. Y la app estrena iconos, tipografía y colores medidos uno a uno.",
    entries: [
      {
        title: "Inicio te dice si llegas a fin de mes",
        hasPreview: true,
        description:
          "Antes abrías y veías tu disponible: una cifra que no dice nada por sí sola, porque RD$28,500 es mucho el día 2 y poco el día 28. Ahora la app hace la cuenta por ti, mirando cómo cierra el mes con lo que ya tienes programado —el san, la tarjeta, la quincena—, y te lo dice en una frase. Lo más útil es el aviso del medio: cuando el mes cierra bien pero hay un día en que no te alcanza porque lo que entra llega después.",
        where: "Inicio"
      },
      {
        title: "La pestaña en la que estás se nota sin mirar el color",
        hasPreview: true,
        description:
          "Los iconos son nuevos y, sobre todo, tienen peso: el de la sección en la que estás se dibuja relleno y los demás en contorno. Antes eso dependía solo del color, y el color se le escapa a cerca de uno de cada doce hombres. Ahora se distingue hasta en blanco y negro.",
        where: "En toda la app"
      },
      {
        title: "Lo que aún no ha pasado se ve de un golpe",
        hasPreview: true,
        description:
          "Lo programado, lo que se repite, lo que está en pausa y lo que espera conexión llevan ahora una marca morada: en el icono y la etiqueta, nunca de fondo, para que el color no pese más que las cifras. Y como lo que ya ocurrió va relleno y lo pendiente en contorno, la diferencia también se ve sin color.",
        where: "Movimientos, Deudas y Metas"
      },
      {
        title: "Los colores dejaron de elegirse a ojo",
        description:
          "En Deudas, el verde de lo que te deben y el terracota de lo que debes quedaban casi iguales para la forma más común de daltonismo. Lo medimos: 7 de separación cuando el mínimo son 8. El verde nuevo está en 19,5. Y de paso, el anillo que marca dónde estás al moverte con el teclado estaba en dorado sobre papel crema —prácticamente invisible— y ahora se ve siempre.",
        where: "En toda la app"
      },
      {
        title: "Más ligera, y con la puerta mejor cerrada",
        description:
          "La primera carga pesa un 17% menos que hace una semana: la validación que solo necesita el servidor ya no viaja a tu teléfono. Además la app manda ahora las cabeceras de seguridad que le faltaban, la API tiene tope de peticiones, y se cerraron cuatro avisos de seguridad en las librerías, uno de ellos crítico y en el paquete que arma la app de Android.",
        where: "En toda la app"
      }
    ]
  },
  {
    version: "1.0",
    date: "2026-11-24",
    title: "Más rápida, y se cuida sola",
    summary:
      "Nada nuevo que tocar: lo que ya había ahora abre antes, no parpadea, te devuelve donde estabas y dice la verdad cuando algo falla.",
    entries: [
      {
        title: "Abre más rápido en el teléfono",
        hasPreview: true,
        description:
          "Antes el teléfono descargaba la app entera —todas las pantallas— antes de enseñarte nada, aunque solo fueras a anotar un gasto. Ahora la primera pantalla no espera a las demás: pesa un 17% menos y Deudas, Reportes o Metas llegan por su cuenta, después, para estar listas cuando entres. Y el panel para registrar un movimiento abre con menos tirón la primera vez de cada sesión: resultó ser el desenfoque del fondo, y quitarlo bajó esa primera apertura de 146 a 83 milésimas. Las siguientes ya iban rápidas antes.",
        where: "En toda la app"
      },
      {
        title: "Cambiar de mes ya no parpadea",
        hasPreview: true,
        description:
          "Al cambiar de periodo la pantalla se vaciaba y volvía un instante después. Ahora lo que estás mirando se queda, apenas atenuado, hasta que llegan las cifras del mes nuevo.",
        where: "Inicio"
      },
      {
        title: "Vuelves donde estabas",
        hasPreview: true,
        description:
          "Ir a mirar una cifra a otra sección y volver te dejaba arriba del todo y sin los filtros que tenías puestos. Ahora cada pestaña recuerda dónde estabas mientras dure la sesión.",
        where: "Movimientos y el resto de secciones"
      },
      {
        title: "Te dice la verdad cuando algo falla",
        hasPreview: true,
        description:
          "En septiembre el servidor estuvo caído nueve días y la pantalla decía «revisa los datos», como si la contraseña estuviera mal. Ahora distingue tres cosas distintas: que el servidor no responde, que tu sesión caducó, y que de verdad escribiste algo mal. Y no solo al entrar: si la sesión se te vence con la app abierta, te lo dice en vez de culpar a la conexión. Además la app se vigila sola: una comprobación diaria avisa si el servicio se cae, y de paso evita que se apague por falta de uso, que fue justo lo que pasó.",
        where: "Al iniciar sesión y en toda la app"
      }
    ]
  },
  {
    version: "0.9",
    date: "2026-09-16",
    title: "Gráficos que responden",
    summary:
      "Tres gráficos nuevos que contestan lo que de verdad te preguntas: si llegas a fin de mes, si vas muy rápido con el presupuesto y qué cambió frente al mes pasado.",
    entries: [
      {
        title: "¿Llego a fin de mes?",
        hasPreview: true,
        description:
          "El inicio muestra tu disponible día a día: lo registrado hasta hoy y, punteado, lo programado hasta el cierre. Los días en que el dinero no alcanza salen en rojo, y el título te dice con cuánto cierras. Toca el gráfico para ver cada día. De paso, el inicio deja de repetir dos veces ingresos, gastos y ahorro.",
        where: "Inicio"
      },
      {
        title: "Presupuesto: ¿voy muy rápido?",
        hasPreview: true,
        description:
          "Cada barra lleva una marca con el punto del mes en que estás. Si el gasto la pasa de largo, la barra cambia de color antes de llegar al límite, cuando todavía hay tiempo de corregir.",
        where: "Presupuesto"
      },
      {
        title: "Reportes: qué cambió frente al mes anterior",
        hasPreview: true,
        description:
          "Categoría por categoría, cuánto subió o bajó tu gasto respecto al mes pasado, empezando por lo que más se movió. Antes Reportes repetía los gráficos del inicio.",
        where: "Reportes"
      }
    ]
  },
  {
    version: "0.8",
    date: "2026-09-15",
    title: "Se siente más ágil",
    summary:
      "Sin funciones nuevas: la app responde cuando la tocas, los paneles entran y salen con suavidad, y cada vez que guardas algo te lo confirma.",
    entries: [
      {
        title: "Te confirma lo que guardas",
        hasPreview: true,
        description:
          "Al guardar un gasto, un presupuesto, una recurrencia o un pago aparece un aviso breve abajo de la pantalla. Antes el mensaje salía dentro de la página y, si habías bajado, no lo veías. Se quita solo, o deslizándolo hacia un lado.",
        where: "En toda la app"
      },
      {
        title: "Responde cuando la tocas",
        description:
          "Botones, filtros y tarjetas se hunden un poco al pulsarlos, así sabes que el toque llegó. Al cambiar de sección ya no se anima cada panel, y la pantalla aparece casi al instante. Si en tu teléfono activaste «reducir movimiento», la app deja de animarse."
      },
      {
        title: "En el teléfono, el panel de movimiento se cierra deslizando",
        description:
          "El panel para registrar un gasto sube desde abajo, y se cierra arrastrando la cabecera hacia abajo, como las hojas del sistema. Los diálogos y el menú de tu cuenta también se cierran con suavidad en vez de desaparecer de golpe.",
        where: "Al registrar o editar un movimiento"
      },
      {
        title: "Avisos más limpios",
        hasPreview: true,
        description:
          "Los avisos de presupuesto, de sin conexión y de error dejan la franja gruesa de color a un lado: ahora llevan fondo de color e icono. En Deudas las tarjetas también la pierden, y el color queda en la etiqueta, la barra y la cifra del resumen.",
        where: "Inicio y Deudas"
      },
      {
        title: "Entrar desde el teléfono sin bajar",
        description:
          "Al iniciar sesión, la presentación se reduce al logo y una frase, y el formulario completo cabe en la primera pantalla. Y la app ya escribe con tildes."
      }
    ]
  },
  {
    version: "0.7",
    date: "2026-08-18",
    title: "Se entiende mejor de un vistazo",
    summary:
      "Sin funciones nuevas: las que ya estaban ahora se leen mejor. Deudas cambia de aspecto y Movimientos deja de pedirte que arrastres de lado en el teléfono.",
    entries: [
      {
        title: "Deudas: el color dice hacia dónde va el dinero",
        hasPreview: true,
        description:
          "Los tres tipos compartían el mismo verde, así que la pantalla no distinguía lo que debes de lo que te deben. Ahora cada uno lleva su color en el borde de la tarjeta, la etiqueta y la barra. Dentro de cada una manda lo que falta: antes era el texto más chico y un botón enorme se llevaba la atención. Y arriba aparece el total, que antes había que sumar a ojo.",
        where: "Deudas"
      },
      {
        title: "Elegir el tipo dejó de ser un desplegable",
        hasPreview: true,
        description:
          "Esa elección decide qué campos aparecen y de qué color sale la tarjeta, y estaba escondida detrás de un clic. Ahora son tres opciones a la vista, con los mismos colores de las tarjetas y una línea que explica cada una.",
        where: "Deudas, al crear un compromiso"
      },
      {
        title: "Movimientos ya no se arrastra de lado",
        hasPreview: true,
        description:
          "La tabla necesitaba más del doble del ancho de un teléfono: el monto quedaba fuera de pantalla. En móvil ahora es una lista donde cada movimiento se lee entero de una vez. Y los filtros se pliegan detrás de un botón, así la lista empieza mucho más arriba.",
        where: "Movimientos, en el teléfono"
      }
    ]
  },
  {
    version: "0.6",
    date: "2026-08-17",
    title: "Ocho cosas nuevas",
    summary:
      "Rumbo pasa de anotar lo que gastas a trabajar por su cuenta: registra lo que se repite, avisa antes de que te pases, y ahora sabe cuánto dinero tienes de verdad.",
    entries: [
      {
        title: "Lo que se repite se registra solo",
        hasPreview: true,
        description:
          "Declaras una vez el alquiler, el sueldo o una suscripción, y Rumbo lo anota el día que toca. Ya no hay que entrar cada mes a escribir lo mismo. Los movimientos que aparecen solos quedan marcados como recurrentes.",
        where: "Movimientos, arriba de la lista"
      },
      {
        title: "Te avisa antes de pasarte del presupuesto",
        hasPreview: true,
        description:
          "Al llegar al 80% de lo que fijaste para una categoría, y de nuevo al pasarte, el inicio te lo dice con el nombre y el monto. Antes solo te enterabas si entrabas a mirar.",
        where: "Inicio y Presupuesto"
      },
      {
        title: "Cuánto apartar al mes para llegar a tu meta",
        hasPreview: true,
        description:
          "Si tu meta tiene fecha, Rumbo divide lo que falta entre los meses que quedan y te dice la cifra. Si te atrasas, la recalcula y te avisa.",
        where: "Metas"
      },
      {
        title: "Ahora sabe cuánto dinero tienes",
        hasPreview: true,
        description:
          "Antes solo contaba el mes, y lo que sobraba en enero desaparecía en febrero. Ahora acumula, y separa lo que ya tienes apartado en metas de lo que sigue libre. Puedes indicar con cuánto empezabas.",
        where: "Inicio, y el saldo inicial en Configuración"
      },
      {
        title: "Deudas, préstamos y sanes",
        hasPreview: true,
        description:
          "Un módulo nuevo para lo que debes y lo que te deben. El san se trata como lo que es: ves la rueda completa, cuál es tu turno, y si por ahora estás prestando al grupo o ya te toca devolver.",
        where: "Deudas"
      },
      {
        title: "Foto del recibo",
        hasPreview: true,
        description:
          "Le adjuntas una foto a un gasto desde la cámara del teléfono. Se guarda en privado y solo tú puedes verla. Dos meses después, ya no hay que adivinar qué era ese cargo.",
        where: "Al registrar o editar un gasto"
      },
      {
        title: "Funciona sin internet",
        hasPreview: true,
        description:
          "Puedes anotar un gasto en la calle aunque no tengas señal. Queda marcado como pendiente y se sube solo en cuanto vuelve la conexión, sin que tengas que hacer nada.",
        where: "En todos lados"
      },
      {
        title: "Recordatorio diario",
        hasPreview: true,
        description:
          "Eliges una hora y Rumbo te avisa para anotar lo del día. El aviso lo lanza tu propio aparato, así que solo suena mientras la app sigue abierta.",
        where: "Configuración"
      }
    ]
  },
  {
    version: "0.5",
    date: "2026-08-12",
    title: "Rumbo en el teléfono",
    summary:
      "La app se instala en Android, y en iPhone se puede añadir a la pantalla de inicio. Las dos se actualizan solas.",
    entries: [
      {
        title: "App de Android instalable",
        description:
          "Rumbo se empaqueta como una app de verdad, con su icono y su nombre. Carga tu misma cuenta y los mismos datos que la web, y se actualiza sola: no hay que reinstalar por cada cambio."
      },
      {
        title: "En iPhone, desde Safari",
        description:
          "Abriendo el sitio en Safari y eligiendo 'Añadir a pantalla de inicio' queda como una app, a pantalla completa y con el logo de Rumbo."
      },
      {
        title: "Retoques de diseño",
        description:
          "Iconos en toda la app, progreso de las metas en un anillo, el gráfico de flujo comparando con el mes anterior, y montos que se formatean con comas mientras escribes."
      }
    ]
  }
];

export const LATEST_RELEASE = RELEASES[0]!;
