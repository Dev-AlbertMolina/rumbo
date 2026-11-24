import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConfirmDialog } from "./ConfirmDialog";

/**
 * Un dialogo que pide confirmacion antes de borrar tiene que estar encima de
 * todo y a plena luz. Montado dentro de la pagina, hereda lo que la pagina le
 * haga: el atenuado de "estos datos son del mes anterior" crea un contexto de
 * apilado, y dentro de el el dialogo queda al 55% y por debajo de la barra de
 * navegacion, que no se atenua.
 */
describe("ConfirmDialog", () => {
  it("se monta fuera de la pagina, para que la pagina no lo atrape", () => {
    const { container } = render(
      <div className="page-transition is-stale">
        <ConfirmDialog
          title="Borrar deuda"
          description="Esto no se puede deshacer."
          onConfirm={() => undefined}
          onCancel={() => undefined}
        />
      </div>
    );

    expect(container.querySelector(".confirm-dialog")).toBeNull();
    expect(document.body.querySelector(".confirm-dialog")).not.toBeNull();
  });
});
