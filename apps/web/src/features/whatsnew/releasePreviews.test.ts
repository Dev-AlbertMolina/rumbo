import { describe, expect, it } from "vitest";
import { RELEASES } from "./releases";
import { RELEASE_PREVIEWS } from "./releasePreviews";

/**
 * Las vistas previas montan pantallas enteras, asi que viven aparte de los
 * datos de las versiones: la barra lateral, el aviso de novedades y su hook
 * leen `releases`, y si de ahi colgaran las vistas previas, cada pantalla
 * retratada viajaria en la descarga inicial de la app.
 *
 * El precio de separarlas es que la correspondencia se hace por titulo. Un
 * titulo cambiado rompe esa correspondencia por los dos lados, y por los dos
 * lados hay que notarlo: la vista previa que se queda huerfana, y la entrada
 * que dice tener una y aparece sin ella. Por eso la entrada declara si la
 * tiene, en vez de que la unica verdad este en el otro archivo.
 */
describe("RELEASE_PREVIEWS", () => {
  const entries = RELEASES.flatMap((release) => release.entries);
  const titles = entries.map((entry) => entry.title);

  it("cada vista previa corresponde a una entrada que la declara", () => {
    for (const key of Object.keys(RELEASE_PREVIEWS)) {
      const entry = entries.find((candidate) => candidate.title === key);
      expect(entry, `vista previa sin entrada: ${key}`).toBeDefined();
      expect(entry?.hasPreview, `la entrada "${key}" no declara vista previa`).toBe(true);
    }
  });

  it("cada entrada que dice tener vista previa la tiene de verdad", () => {
    for (const entry of entries.filter((candidate) => candidate.hasPreview)) {
      expect(
        Object.keys(RELEASE_PREVIEWS),
        `la entrada "${entry.title}" promete una vista previa que no existe`
      ).toContain(entry.title);
    }
  });

  it("no hay dos entradas con el mismo titulo, que es lo que las identifica", () => {
    expect(new Set(titles).size).toBe(titles.length);
  });
});
