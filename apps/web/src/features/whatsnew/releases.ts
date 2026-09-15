import type { ComponentType } from "react";
import {
  BalancePreview,
  DebtKindPickerPreview,
  DebtsModulePreview,
  MovementsMobilePreview,
  BudgetAlertPreview,
  GoalPacePreview,
  OfflinePreview,
  ReceiptPreview,
  RecurrencePreview,
  ReminderPreview,
  SanPreview,
  ToastPreview
} from "./previews";

export interface ReleaseEntry {
  title: string;
  /** Que cambio, en una o dos frases y sin jerga. */
  description: string;
  /** Donde encontrarlo dentro de la app. */
  where?: string;
  /** El componente real de la app, montado con datos de ejemplo. */
  Preview?: ComponentType;
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
    version: "0.8",
    date: "2026-09-15",
    title: "Se siente más ágil",
    summary:
      "Sin funciones nuevas: la app responde cuando la tocas, los paneles entran y salen con suavidad, y cada vez que guardas algo te lo confirma.",
    entries: [
      {
        title: "Te confirma lo que guardas",
        description:
          "Al guardar un gasto, un presupuesto, una recurrencia o un pago aparece un aviso breve abajo de la pantalla. Antes el mensaje salía dentro de la página y, si habías bajado, no lo veías. Se quita solo, o deslizándolo hacia un lado.",
        where: "En toda la app",
        Preview: ToastPreview
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
        description:
          "Los avisos de presupuesto, de sin conexión y de error dejan la franja gruesa de color a un lado: ahora llevan fondo de color e icono. En Deudas las tarjetas también la pierden, y el color queda en la etiqueta, la barra y la cifra del resumen.",
        where: "Inicio y Deudas",
        Preview: BudgetAlertPreview
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
        description:
          "Los tres tipos compartían el mismo verde, así que la pantalla no distinguía lo que debes de lo que te deben. Ahora cada uno lleva su color en el borde de la tarjeta, la etiqueta y la barra. Dentro de cada una manda lo que falta: antes era el texto más chico y un botón enorme se llevaba la atención. Y arriba aparece el total, que antes había que sumar a ojo.",
        where: "Deudas",
        Preview: DebtsModulePreview
      },
      {
        title: "Elegir el tipo dejó de ser un desplegable",
        description:
          "Esa elección decide qué campos aparecen y de qué color sale la tarjeta, y estaba escondida detrás de un clic. Ahora son tres opciones a la vista, con los mismos colores de las tarjetas y una línea que explica cada una.",
        where: "Deudas, al crear un compromiso",
        Preview: DebtKindPickerPreview
      },
      {
        title: "Movimientos ya no se arrastra de lado",
        description:
          "La tabla necesitaba más del doble del ancho de un teléfono: el monto quedaba fuera de pantalla. En móvil ahora es una lista donde cada movimiento se lee entero de una vez. Y los filtros se pliegan detrás de un botón, así la lista empieza mucho más arriba.",
        where: "Movimientos, en el teléfono",
        Preview: MovementsMobilePreview
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
        description:
          "Declaras una vez el alquiler, el sueldo o una suscripción, y Rumbo lo anota el día que toca. Ya no hay que entrar cada mes a escribir lo mismo. Los movimientos que aparecen solos quedan marcados como recurrentes.",
        where: "Movimientos, arriba de la lista",
        Preview: RecurrencePreview
      },
      {
        title: "Te avisa antes de pasarte del presupuesto",
        description:
          "Al llegar al 80% de lo que fijaste para una categoría, y de nuevo al pasarte, el inicio te lo dice con el nombre y el monto. Antes solo te enterabas si entrabas a mirar.",
        where: "Inicio y Presupuesto",
        Preview: BudgetAlertPreview
      },
      {
        title: "Cuánto apartar al mes para llegar a tu meta",
        description:
          "Si tu meta tiene fecha, Rumbo divide lo que falta entre los meses que quedan y te dice la cifra. Si te atrasas, la recalcula y te avisa.",
        where: "Metas",
        Preview: GoalPacePreview
      },
      {
        title: "Ahora sabe cuánto dinero tienes",
        description:
          "Antes solo contaba el mes, y lo que sobraba en enero desaparecía en febrero. Ahora acumula, y separa lo que ya tienes apartado en metas de lo que sigue libre. Puedes indicar con cuánto empezabas.",
        where: "Inicio, y el saldo inicial en Configuración",
        Preview: BalancePreview
      },
      {
        title: "Deudas, préstamos y sanes",
        description:
          "Un módulo nuevo para lo que debes y lo que te deben. El san se trata como lo que es: ves la rueda completa, cuál es tu turno, y si por ahora estás prestando al grupo o ya te toca devolver.",
        where: "Deudas",
        Preview: SanPreview
      },
      {
        title: "Foto del recibo",
        description:
          "Le adjuntas una foto a un gasto desde la cámara del teléfono. Se guarda en privado y solo tú puedes verla. Dos meses después, ya no hay que adivinar qué era ese cargo.",
        where: "Al registrar o editar un gasto",
        Preview: ReceiptPreview
      },
      {
        title: "Funciona sin internet",
        description:
          "Puedes anotar un gasto en la calle aunque no tengas señal. Queda marcado como pendiente y se sube solo en cuanto vuelve la conexión, sin que tengas que hacer nada.",
        where: "En todos lados",
        Preview: OfflinePreview
      },
      {
        title: "Recordatorio diario",
        description:
          "Eliges una hora y Rumbo te avisa para anotar lo del día. El aviso lo lanza tu propio aparato, así que solo suena mientras la app sigue abierta.",
        where: "Configuración",
        Preview: ReminderPreview
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
