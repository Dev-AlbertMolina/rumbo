import { useEffect, useState, type ReactNode } from "react";
import { browserScroll, restoreScrollWhenReady } from "./scrollRestore";
import { recallScroll, rememberScroll } from "./viewMemory";

export function usePathname() {
  const [pathname, setPathname] = useState(window.location.pathname);
  useEffect(() => {
    const update = () => setPathname(window.location.pathname);
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return pathname;
}

export function navigate(path: string) {
  if (window.location.pathname === path) return;
  // Donde estabas se guarda antes de irte, y al volver se restaura: ir a
  // mirar una cifra a otra seccion ya no cuesta rehacer el camino.
  rememberScroll(window.location.pathname, window.scrollY);
  window.history.pushState({}, "", path);
  window.dispatchEvent(new PopStateEvent("popstate"));
  restoreScrollWhenReady(recallScroll(path), browserScroll());
}

export function RouteLink({
  to,
  className,
  children
}: {
  to: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}
