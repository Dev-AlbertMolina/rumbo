import type { CSSProperties, ReactElement } from "react";
import type { IconWeights } from "./iconPaths";
import {
  AlertTrianglePaths,
  ArrowDownLeftPaths,
  ArrowUpDownPaths,
  ArrowUpRightPaths,
  BarChart2Paths,
  BellPaths,
  BellOffPaths,
  BriefcasePaths,
  CalendarDaysPaths,
  CalendarXPaths,
  CameraPaths,
  CarPaths,
  CheckCircle2Paths,
  ChevronDownPaths,
  CircleCheckPaths,
  CircleDotPaths,
  ClockPaths,
  CloudOffPaths,
  CoinsPaths,
  DownloadPaths,
  GaugePaths,
  GemPaths,
  GraduationCapPaths,
  HandCoinsPaths,
  HandshakePaths,
  HeartPaths,
  HomePaths,
  LandmarkPaths,
  LayoutGridPaths,
  Loader2Paths,
  LockPaths,
  MapPinPaths,
  MoreHorizontalPaths,
  PaperclipPaths,
  PartyPopperPaths,
  PausePaths,
  PauseCirclePaths,
  PencilPaths,
  PiggyBankPaths,
  PlayPaths,
  PlusPaths,
  RefreshCwPaths,
  RepeatPaths,
  ShieldCheckPaths,
  SlidersHorizontalPaths,
  SparklesPaths,
  SproutPaths,
  TagPaths,
  TargetPaths,
  Trash2Paths,
  TrendingDownPaths,
  TrendingUpPaths,
  UserPaths,
  UsersPaths,
  UtensilsCrossedPaths,
  WalletPaths,
  WifiOffPaths,
  ZapPaths
} from "./iconPaths";

/**
 * Los iconos de Rumbo, y el unico sitio que sabe de donde salen.
 *
 * El dibujo es de Phosphor, que trae varios pesos del mismo icono: eso
 * permite que el peso signifique algo —relleno para la pestana en la que
 * estas, contorno para las demas— en vez de que el estado activo dependa solo
 * del color, como pasaba con Lucide, que tiene un unico grosor.
 *
 * Lo que no se usa es su paquete de React: mete los seis pesos de cada icono
 * dentro de cada componente, y con los 58 que usa Rumbo eso medimos que
 * costaba 92 KB en la primera carga. En su lugar, `scripts/generar-iconos.mjs`
 * copia solo los pesos que de verdad se dibujan (26 KB sin comprimir) y este
 * archivo los convierte en componentes con los nombres de siempre.
 */

/** Dos medidas, no cinco: dentro del texto, y en cabeceras o navegacion. */
export const ICON_TEXT = 18;
export const ICON_UI = 24;

export interface IconProps {
  /** Usa ICON_TEXT o ICON_UI salvo que haya un motivo. */
  size?: number;
  /** `fill` para lo que esta activo o se celebra; contorno para lo demas. */
  weight?: "regular" | "fill";
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean | "true" | "false";
  "aria-label"?: string;
}

export type IconComponent = (props: IconProps) => ReactElement;

function makeIcon(weights: IconWeights, name: string): IconComponent {
  const outline = weights.regular;
  const filled = weights.fill;

  function Icon({ size = ICON_TEXT, weight = "regular", ...rest }: IconProps) {
    // Si alguien pide relleno donde no se genero, se dibuja el contorno: es
    // peor un hueco en blanco que un icono con el peso que no era.
    const markup = (weight === "fill" && filled) || outline;
    return (
      <svg
        {...rest}
        width={size}
        height={size}
        viewBox="0 0 256 256"
        data-weight={weight === "fill" && filled ? "fill" : "regular"}
        fill="currentColor"
        focusable="false"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }

  Icon.displayName = name;
  return Icon;
}

export const AlertTriangle = /* @__PURE__ */ makeIcon(AlertTrianglePaths, "AlertTriangle");
export const ArrowDownLeft = /* @__PURE__ */ makeIcon(ArrowDownLeftPaths, "ArrowDownLeft");
export const ArrowUpDown = /* @__PURE__ */ makeIcon(ArrowUpDownPaths, "ArrowUpDown");
export const ArrowUpRight = /* @__PURE__ */ makeIcon(ArrowUpRightPaths, "ArrowUpRight");
export const BarChart2 = /* @__PURE__ */ makeIcon(BarChart2Paths, "BarChart2");
export const Bell = /* @__PURE__ */ makeIcon(BellPaths, "Bell");
export const BellOff = /* @__PURE__ */ makeIcon(BellOffPaths, "BellOff");
export const Briefcase = /* @__PURE__ */ makeIcon(BriefcasePaths, "Briefcase");
export const CalendarDays = /* @__PURE__ */ makeIcon(CalendarDaysPaths, "CalendarDays");
export const CalendarX = /* @__PURE__ */ makeIcon(CalendarXPaths, "CalendarX");
export const Camera = /* @__PURE__ */ makeIcon(CameraPaths, "Camera");
export const Car = /* @__PURE__ */ makeIcon(CarPaths, "Car");
export const CheckCircle2 = /* @__PURE__ */ makeIcon(CheckCircle2Paths, "CheckCircle2");
export const ChevronDown = /* @__PURE__ */ makeIcon(ChevronDownPaths, "ChevronDown");
export const CircleCheck = /* @__PURE__ */ makeIcon(CircleCheckPaths, "CircleCheck");
export const CircleDot = /* @__PURE__ */ makeIcon(CircleDotPaths, "CircleDot");
export const Clock = /* @__PURE__ */ makeIcon(ClockPaths, "Clock");
export const CloudOff = /* @__PURE__ */ makeIcon(CloudOffPaths, "CloudOff");
export const Coins = /* @__PURE__ */ makeIcon(CoinsPaths, "Coins");
export const Download = /* @__PURE__ */ makeIcon(DownloadPaths, "Download");
export const Gauge = /* @__PURE__ */ makeIcon(GaugePaths, "Gauge");
export const Gem = /* @__PURE__ */ makeIcon(GemPaths, "Gem");
export const GraduationCap = /* @__PURE__ */ makeIcon(GraduationCapPaths, "GraduationCap");
export const HandCoins = /* @__PURE__ */ makeIcon(HandCoinsPaths, "HandCoins");
export const Handshake = /* @__PURE__ */ makeIcon(HandshakePaths, "Handshake");
export const Heart = /* @__PURE__ */ makeIcon(HeartPaths, "Heart");
export const Home = /* @__PURE__ */ makeIcon(HomePaths, "Home");
export const Landmark = /* @__PURE__ */ makeIcon(LandmarkPaths, "Landmark");
export const LayoutGrid = /* @__PURE__ */ makeIcon(LayoutGridPaths, "LayoutGrid");
export const Loader2 = /* @__PURE__ */ makeIcon(Loader2Paths, "Loader2");
export const Lock = /* @__PURE__ */ makeIcon(LockPaths, "Lock");
export const MapPin = /* @__PURE__ */ makeIcon(MapPinPaths, "MapPin");
export const MoreHorizontal = /* @__PURE__ */ makeIcon(MoreHorizontalPaths, "MoreHorizontal");
export const Paperclip = /* @__PURE__ */ makeIcon(PaperclipPaths, "Paperclip");
export const PartyPopper = /* @__PURE__ */ makeIcon(PartyPopperPaths, "PartyPopper");
export const Pause = /* @__PURE__ */ makeIcon(PausePaths, "Pause");
export const PauseCircle = /* @__PURE__ */ makeIcon(PauseCirclePaths, "PauseCircle");
export const Pencil = /* @__PURE__ */ makeIcon(PencilPaths, "Pencil");
export const PiggyBank = /* @__PURE__ */ makeIcon(PiggyBankPaths, "PiggyBank");
export const Play = /* @__PURE__ */ makeIcon(PlayPaths, "Play");
export const Plus = /* @__PURE__ */ makeIcon(PlusPaths, "Plus");
export const RefreshCw = /* @__PURE__ */ makeIcon(RefreshCwPaths, "RefreshCw");
export const Repeat = /* @__PURE__ */ makeIcon(RepeatPaths, "Repeat");
export const ShieldCheck = /* @__PURE__ */ makeIcon(ShieldCheckPaths, "ShieldCheck");
export const SlidersHorizontal = /* @__PURE__ */ makeIcon(SlidersHorizontalPaths, "SlidersHorizontal");
export const Sparkles = /* @__PURE__ */ makeIcon(SparklesPaths, "Sparkles");
export const Sprout = /* @__PURE__ */ makeIcon(SproutPaths, "Sprout");
export const Tag = /* @__PURE__ */ makeIcon(TagPaths, "Tag");
export const Target = /* @__PURE__ */ makeIcon(TargetPaths, "Target");
export const Trash2 = /* @__PURE__ */ makeIcon(Trash2Paths, "Trash2");
export const TrendingDown = /* @__PURE__ */ makeIcon(TrendingDownPaths, "TrendingDown");
export const TrendingUp = /* @__PURE__ */ makeIcon(TrendingUpPaths, "TrendingUp");
export const User = /* @__PURE__ */ makeIcon(UserPaths, "User");
export const Users = /* @__PURE__ */ makeIcon(UsersPaths, "Users");
export const UtensilsCrossed = /* @__PURE__ */ makeIcon(UtensilsCrossedPaths, "UtensilsCrossed");
export const Wallet = /* @__PURE__ */ makeIcon(WalletPaths, "Wallet");
export const WifiOff = /* @__PURE__ */ makeIcon(WifiOffPaths, "WifiOff");
export const Zap = /* @__PURE__ */ makeIcon(ZapPaths, "Zap");
