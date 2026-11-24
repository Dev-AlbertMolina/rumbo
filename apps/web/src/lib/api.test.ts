import { afterEach, describe, expect, it, vi } from "vitest";
import { apiFetch, resolveApiUrl } from "./api";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.resetModules();
});

/** Recarga el modulo para releer VITE_API_BASE_URL, que se evalua al importar. */
async function importApiWithBase(baseUrl: string) {
  vi.stubEnv("VITE_API_BASE_URL", baseUrl);
  vi.resetModules();
  return import("./api");
}

describe("apiFetch", () => {
  it("adds the current bearer token and preserves existing headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response(null));

    await apiFetch("session-token", "/api/spaces", {
      headers: { "Content-Type": "application/json" }
    });

    const [, init] = fetchMock.mock.calls[0]!;
    const headers = new Headers(init?.headers);
    expect(headers.get("Authorization")).toBe("Bearer session-token");
    expect(headers.get("Content-Type")).toBe("application/json");
  });

  it("no espera para siempre a una peticion que no contesta", async () => {
    // Un movil que pierde la red a mitad de peticion no recibe un error: no
    // recibe nada. Sin plazo propio, la pantalla se queda atenuada, con las
    // cifras del mes anterior a la vista, hasta que la persona la recarga.
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        })
    );

    await expect(
      apiFetch("session-token", "/api/spaces", { timeoutMs: 20 })
    ).rejects.toThrow(/no pudimos conectar/i);
  });

  it("la cancelacion de un cambio de mes sigue llegando como cancelacion", async () => {
    // El plazo no puede confundirse con cancelar a proposito: quien cancela es
    // el propio cambio de mes, y ese caso se ignora en silencio.
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => reject(init.signal?.reason));
        })
    );
    const controller = new AbortController();
    const pending = apiFetch("session-token", "/api/spaces", { signal: controller.signal });
    controller.abort();

    await expect(pending).rejects.toSatisfy(
      (reason: unknown) => reason instanceof DOMException && reason.name === "AbortError"
    );
  });

  it("does not make financial requests without a session", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await expect(apiFetch(null, "/api/spaces")).rejects.toThrow("Necesitas iniciar sesión");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("resolveApiUrl", () => {
  it("keeps paths relative on the web build, where the API shares the domain", () => {
    expect(resolveApiUrl("/api/spaces")).toBe("/api/spaces");
  });

  it("rewrites relative paths against the production API in the native build", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app");

    expect(api.resolveApiUrl("/api/spaces")).toBe("https://rumbo-web-sepia.vercel.app/api/spaces");
  });

  it("does not double the slash when the base ends with one", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app/");

    expect(api.resolveApiUrl("/api/spaces")).toBe("https://rumbo-web-sepia.vercel.app/api/spaces");
  });

  it("leaves absolute URLs untouched", async () => {
    const api = await importApiWithBase("https://rumbo-web-sepia.vercel.app");

    expect(api.resolveApiUrl("https://otro.example/api/spaces")).toBe(
      "https://otro.example/api/spaces"
    );
  });
});
