import { Plus } from "../icons";
import { RouteLink } from "../../app/router";
import { LATEST_RELEASE } from "../../features/whatsnew/releases";
import { ICON_TEXT } from "../icons";
import { isCurrent, NAV_ITEMS } from "./nav-items";
import { RumboLogo } from "./RumboLogo";
import { UserMenu } from "./UserMenu";

export function Sidebar({
  pathname,
  user,
  onSignOut,
  onAdd
}: {
  pathname: string;
  user: { email?: string; user_metadata?: Record<string, unknown> } | null;
  onSignOut: () => void;
  onAdd: () => void;
}) {
  return (
    <aside className="sidebar">
      <RumboLogo />
      <button className="primary add-button" onClick={onAdd}>
        <Plus size={18} /> Agregar
      </button>
      <nav aria-label="Navegación principal">
        {NAV_ITEMS.map(({ path, Icon, label }) => {
          const current = isCurrent(path, pathname);
          return (
            <RouteLink key={path} to={path} className={current ? "active" : ""}>
              <span>
                <Icon size={ICON_TEXT} weight={current ? "fill" : "regular"} />
              </span>{" "}
              {label}
            </RouteLink>
          );
        })}
      </nav>
      <div className="sidebar-foot">
        {user && <UserMenu user={user} onSignOut={onSignOut} className="sidebar-user-menu" />}
        <small>v{LATEST_RELEASE.version}</small>
      </div>
    </aside>
  );
}
