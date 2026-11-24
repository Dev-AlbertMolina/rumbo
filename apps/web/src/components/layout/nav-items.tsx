import {
  ArrowUpDown,
  BarChart2,
  HandCoins,
  Home,
  LayoutGrid,
  Target,
  type IconComponent
} from "../icons";

export interface NavItem {
  path: string;
  /**
   * El componente del icono, no un elemento ya creado: quien lo pinta decide
   * el tamano, y asi la lista deja de ser un array de JSX suelto sin `key`.
   */
  Icon: IconComponent;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { path: "/", Icon: Home, label: "Inicio" },
  { path: "/movimientos", Icon: ArrowUpDown, label: "Movimientos" },
  { path: "/presupuesto", Icon: LayoutGrid, label: "Presupuesto" },
  { path: "/metas", Icon: Target, label: "Metas" },
  { path: "/deudas", Icon: HandCoins, label: "Deudas" },
  { path: "/reportes", Icon: BarChart2, label: "Reportes" }
];

/**
 * Si esta entrada es la que se esta viendo.
 *
 * Estaba escrito igual en la barra lateral y en la de abajo; una de las dos
 * se habria quedado atras el dia que cambie una ruta.
 */
export function isCurrent(path: string, pathname: string): boolean {
  return pathname === path || (path === "/" && pathname === "/inicio");
}
