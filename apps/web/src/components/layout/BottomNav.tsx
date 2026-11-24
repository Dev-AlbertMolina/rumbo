import { RouteLink } from "../../app/router";
import { ICON_UI } from "../icons";
import { isCurrent, NAV_ITEMS } from "./nav-items";

export function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      {NAV_ITEMS.map(({ path, Icon, label }) => {
        const current = isCurrent(path, pathname);
        return (
          <RouteLink key={path} to={path} className={current ? "active" : ""}>
            <span>
              <Icon size={ICON_UI} weight={current ? "fill" : "regular"} />
            </span>
            {/* El texto va envuelto para poder recortarlo: con seis entradas, en
              pantallas de 360px la palabra mas larga no cabe entera, y es
              preferible un puntito suspensivo a que la barra se parta en dos. */}
            <small>{label}</small>
          </RouteLink>
        );
      })}
    </nav>
  );
}
