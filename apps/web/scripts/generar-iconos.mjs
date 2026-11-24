/**
 * Genera `src/components/iconPaths.ts` a partir de los SVG de Phosphor.
 *
 * Por que no usar `@phosphor-icons/react` directamente: ese paquete trae los
 * seis pesos de cada icono dentro de cada componente. Con los 58 que usa
 * Rumbo eso son 92 KB en la primera carga, medidos, y esta app acaba de
 * adelgazar 88. Aqui se copian solo los pesos que de verdad se usan: el
 * contorno de todos, y el relleno de los seis de navegacion y los tres que
 * celebran algo.
 *
 * Correr con: npm run iconos -w @ahorra/web
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..", "..");
const assets = join(root, "node_modules", "@phosphor-icons", "core", "assets");

/** Nuestro nombre -> nombre de Phosphor. El mismo mapa que usaba icons.ts. */
const NAMES = {
  AlertTriangle: "Warning",
  ArrowDownLeft: "ArrowDownLeft",
  ArrowUpDown: "ArrowsDownUp",
  ArrowUpRight: "ArrowUpRight",
  BarChart2: "ChartBar",
  Bell: "Bell",
  BellOff: "BellSlash",
  Briefcase: "Briefcase",
  CalendarDays: "CalendarDots",
  CalendarX: "CalendarX",
  Camera: "Camera",
  Car: "Car",
  CheckCircle2: "CheckCircle",
  ChevronDown: "CaretDown",
  CircleCheck: "CheckCircle",
  CircleDot: "RadioButton",
  Clock: "Clock",
  CloudOff: "CloudSlash",
  Coins: "Coins",
  Download: "DownloadSimple",
  Gauge: "Gauge",
  Gem: "Diamond",
  GraduationCap: "GraduationCap",
  HandCoins: "HandCoins",
  Handshake: "Handshake",
  Heart: "Heart",
  Home: "House",
  Landmark: "Bank",
  LayoutGrid: "SquaresFour",
  Loader2: "CircleNotch",
  Lock: "Lock",
  MapPin: "MapPin",
  MoreHorizontal: "DotsThree",
  Paperclip: "Paperclip",
  PartyPopper: "Confetti",
  Pause: "Pause",
  PauseCircle: "PauseCircle",
  Pencil: "PencilSimple",
  PiggyBank: "PiggyBank",
  Play: "Play",
  Plus: "Plus",
  RefreshCw: "ArrowsClockwise",
  Repeat: "Repeat",
  ShieldCheck: "ShieldCheck",
  SlidersHorizontal: "SlidersHorizontal",
  Sparkles: "Sparkle",
  Sprout: "Plant",
  Tag: "Tag",
  Target: "Target",
  Trash2: "Trash",
  TrendingDown: "TrendDown",
  TrendingUp: "TrendUp",
  User: "User",
  Users: "Users",
  UtensilsCrossed: "ForkKnife",
  Wallet: "Wallet",
  WifiOff: "WifiSlash",
  Zap: "Lightning"
};

/**
 * Los que ademas se dibujan rellenos.
 *
 * Los seis de la barra de navegacion, porque el relleno es lo que dice que
 * esa pestana es la que estas viendo (antes dependia solo del color), y los
 * tres que celebran: meta cumplida, deuda saldada, enhorabuena.
 */
const FILLED = [
  "Home",
  "ArrowUpDown",
  "LayoutGrid",
  "Target",
  "HandCoins",
  "BarChart2",
  "CheckCircle2",
  "CircleCheck",
  "PartyPopper"
];

/** PascalCase -> kebab-case, que es como se llaman los archivos. */
function kebab(name) {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Z])([A-Z][a-z])/g, "$1-$2")
    .toLowerCase();
}

/** Lo de dentro del <svg>, que es lo unico que hace falta copiar. */
function innerSvg(file) {
  const raw = readFileSync(file, "utf8");
  const inner = raw.match(/<svg[^>]*>([\s\S]*)<\/svg>/);
  if (!inner) throw new Error(`no entiendo ${file}`);
  return inner[1].replace(/<rect[^>]*fill="none"[^>]*\/>/g, "").trim();
}

const entries = [];
const missing = [];

for (const [ours, theirs] of Object.entries(NAMES)) {
  const file = kebab(theirs);
  const regular = join(assets, "regular", `${file}.svg`);
  if (!existsSync(regular)) {
    missing.push(`${ours} -> ${file}.svg`);
    continue;
  }
  const weights = { regular: innerSvg(regular) };
  if (FILLED.includes(ours)) {
    const fill = join(assets, "fill", `${file}-fill.svg`);
    if (!existsSync(fill)) missing.push(`${ours} (relleno) -> ${file}-fill.svg`);
    else weights.fill = innerSvg(fill);
  }
  entries.push([ours, weights]);
}

if (missing.length) {
  console.error("Faltan archivos:\n  " + missing.join("\n  "));
  process.exit(1);
}

// Una constante por icono, no un objeto con los 58 dentro: asi el
// empaquetador puede dejar fuera de cada pantalla los que no dibuja.
const body = entries
  .map(([name, weights]) => {
    const parts = Object.entries(weights)
      .map(([weight, content]) => `  ${weight}: ${JSON.stringify(content)}`)
      .join(",\n");
    return `export const ${name}Paths: IconWeights = {\n${parts}\n};`;
  })
  .join("\n\n");

const file = `// Generado por scripts/generar-iconos.mjs. No editar a mano.
//
// Solo los pesos que la app usa: el contorno de todos y el relleno de los que
// lo necesitan para decir algo. El paquete de React de Phosphor trae los seis
// pesos de cada icono y costaba 92 KB en la primera carga.

export interface IconWeights {
  regular: string;
  fill?: string;
}

${body}
`;

writeFileSync(join(here, "..", "src", "components", "iconPaths.ts"), file);
console.log(
  `iconPaths.ts: ${entries.length} iconos, ${entries.filter(([, w]) => w.fill).length} con relleno`
);
