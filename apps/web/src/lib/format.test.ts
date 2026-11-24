import { describe, expect, it } from "vitest";
import { readJson } from "./format";

function responseWith(status: number) {
  return new Response(JSON.stringify({ error: "nope" }), {
    status,
    headers: { "Content-Type": "application/json" }
  });
}

/**
 * Lo que la persona lee cuando una pantalla no carga. "No pudimos cargar la
 * informacion" para todo esconde justo las dos cosas que se pueden hacer algo
 * al respecto: volver a entrar, o esperar a que el servidor vuelva.
 */
describe("readJson", () => {
  it("devuelve el cuerpo cuando la respuesta esta bien", async () => {
    const response = new Response(JSON.stringify([1, 2]), {
      headers: { "Content-Type": "application/json" }
    });
    await expect(readJson<number[]>(response)).resolves.toEqual([1, 2]);
  });

  it("dice que la sesion caduco cuando el servidor rechaza el token", async () => {
    await expect(readJson(responseWith(401))).rejects.toThrow(/sesión/i);
  });

  it("dice lo mismo ante un 403, que tambien es la sesion", async () => {
    await expect(readJson(responseWith(403))).rejects.toThrow(/sesión/i);
  });

  it("culpa al servidor cuando el servidor es el que falla", async () => {
    await expect(readJson(responseWith(503))).rejects.toThrow(/no pudimos conectar/i);
  });

  it("tambien ante un 500, que es el mismo problema visto de otro lado", async () => {
    await expect(readJson(responseWith(500))).rejects.toThrow(/no pudimos conectar/i);
  });

  it("para el resto se queda con el mensaje de siempre", async () => {
    await expect(readJson(responseWith(404))).rejects.toThrow(/no pudimos cargar/i);
  });
});
