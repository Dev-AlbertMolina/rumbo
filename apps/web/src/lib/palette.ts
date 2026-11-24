/**
 * Los colores de Rumbo como datos, y las tres medidas que deciden si sirven.
 *
 * Vivian sueltos en la hoja de estilos, donde nadie podia comprobarlos. Aqui
 * se pueden medir, y `palette.test.ts` los mide en cada ejecucion de pruebas:
 * contraste contra el papel, croma (que no se lean grises) y distancia para
 * las dos formas comunes de daltonismo.
 *
 * Las cuentas son las estandar: sRGB a OKLab para medir diferencias como las
 * ve el ojo, y las matrices de Machado (2009) para simular daltonismo.
 */

export const PAPER = "#fff8f0";

/** Colores que significan algo en una grafica, una barra o un punto. */
export const DATA_COLORS: Record<string, string> = {
  money_in: "#0f9c6e",
  money_out: "#a94725",
  money_aside: "#6b2948",
  debt: "#a31f33",
  loan: "#0f9c6e"
};

/** Colores que se usan como letra, y por eso se miden contra 4.5:1. */
export const TEXT_COLORS: Record<string, string> = {
  ink: "#2b211e",
  muted: "#665851",
  primary: "#6b2948",
  danger: "#a31f33",
  // El verde de las letras no es el de las barras: el que se lee sobre papel
  // (5.66:1) es demasiado apagado para una marca, y el que se ve como marca
  // (3.32:1) no llega al minimo de un texto. Son dos trabajos distintos.
  success_ink: "#267052"
};

type Triple = [number, number, number];

function channels(hex: string): Triple {
  const value = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255) as Triple;
}

/** De sRGB con gamma a luz lineal, que es donde se puede sumar y mezclar. */
function toLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

function linearOf(hex: string): Triple {
  return channels(hex).map(toLinear) as Triple;
}

/** Contraste WCAG: la medida que decide si una letra se lee. */
export function contrast(a: string, b: string): number {
  const luminance = (hex: string) => {
    const [r, g, blue] = linearOf(hex);
    return 0.2126 * r + 0.7152 * g + 0.0722 * blue;
  };
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** OKLab: el espacio donde una diferencia numerica se parece a la que ve el ojo. */
function toOklab([r, g, b]: Triple): Triple {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s
  ];
}

/**
 * Cuanto color tiene, de cero (gris) en adelante.
 *
 * Un color de dato por debajo de 0.1 se lee como gris aunque tenga nombre de
 * color: pasaba con el verde #267052, que daba 0.088.
 */
export function chroma(hex: string): number {
  const [, a, b] = toOklab(linearOf(hex));
  return Math.sqrt(a * a + b * b);
}

/**
 * Matrices de Machado, Oliveira y Fernandes (2009) para dicromatismo completo.
 * Se aplican sobre luz lineal, no sobre el hex.
 */
const CVD_MATRICES: Record<"deuteranopia" | "protanopia", number[][]> = {
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881]
  ],
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998]
  ]
};

function simulate(hex: string, kind: keyof typeof CVD_MATRICES): Triple {
  const linear = linearOf(hex);
  const matrix = CVD_MATRICES[kind];
  return matrix.map((row) =>
    Math.min(1, Math.max(0, row[0]! * linear[0] + row[1]! * linear[1] + row[2]! * linear[2]))
  ) as Triple;
}

function distance(a: Triple, b: Triple): number {
  const first = toOklab(a);
  const second = toOklab(b);
  const dl = first[0] - second[0];
  const da = first[1] - second[1];
  const db = first[2] - second[2];
  // Por cien, para trabajar con numeros de dos cifras en vez de decimales.
  return Math.sqrt(dl * dl + da * da + db * db) * 100;
}

/** Lo lejos que quedan dos colores para quien no distingue rojo y verde. */
export function cvdDistance(
  a: string,
  b: string,
  kind: keyof typeof CVD_MATRICES = "deuteranopia"
): number {
  return distance(simulate(a, kind), simulate(b, kind));
}

/** Lo lejos que quedan a ojo normal. Dos categorias vecinas piden 15. */
export function normalDistance(a: string, b: string): number {
  return distance(linearOf(a), linearOf(b));
}
