import { describe, expect, it } from "vitest";
import { RELEASES } from "./releases";
import { RELEASE_PREVIEWS } from "./releasePreviews";

/**
 * Las vistas previas montan pantallas enteras, asi que viven aparte de los
 * datos de las versiones: la barra lateral, el aviso de novedades y su hook
 * leen `releases`, y si de ahi colgaran las vistas previas, cada pantalla
 * retratada viajaria en la descarga inicial de la app.
 *
 * El precio de separarlas es que la correspondencia se hace por titulo, y un
 * titulo cambiado dejaria una vista previa huerfana sin avisar. Esta prueba es
 * ese aviso.
 */
describe("RELEASE_PREVIEWS", () => {
  const titles = RELEASES.flatMap((release) => release.entries.map((entry) => entry.title));

  it("cada vista previa corresponde a una entrada que existe", () => {
    for (const key of Object.keys(RELEASE_PREVIEWS)) {
      expect(titles).toContain(key);
    }
  });

  it("no hay dos entradas con el mismo titulo, que es lo que las identifica", () => {
    expect(new Set(titles).size).toBe(titles.length);
  });
});
