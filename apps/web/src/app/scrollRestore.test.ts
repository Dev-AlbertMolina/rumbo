import { describe, expect, it } from "vitest";
import { restoreScrollWhenReady } from "./scrollRestore";

/**
 * Con las pantallas cargandose al entrar, al navegar la pagina esta vacia
 * durante unos fotogramas: poner el scroll ahi no sirve de nada, porque todavia
 * no hay nada que recorrer. Hay que esperar a que el contenido ocupe sitio.
 */
function fakeFrames() {
  const pending: Array<() => void> = [];
  return {
    nextFrame(callback: () => void) {
      pending.push(callback);
    },
    tick(times = 1) {
      for (let i = 0; i < times; i++) pending.shift()?.();
    },
    get waiting() {
      return pending.length;
    }
  };
}

describe("restoreScrollWhenReady", () => {
  it("espera a que la pagina sea lo bastante alta antes de bajar", () => {
    const frames = fakeFrames();
    let height = 400;
    let top = 0;

    restoreScrollWhenReady(600, {
      viewportHeight: () => 800,
      documentHeight: () => height,
      scrollTo: (value) => (top = value),
      nextFrame: frames.nextFrame
    });

    expect(top).toBe(0);

    height = 2000;
    frames.tick();
    expect(top).toBe(600);
  });

  it("baja de inmediato cuando el contenido ya esta", () => {
    const frames = fakeFrames();
    let top = 0;

    restoreScrollWhenReady(300, {
      viewportHeight: () => 800,
      documentHeight: () => 3000,
      scrollTo: (value) => (top = value),
      nextFrame: frames.nextFrame
    });

    expect(top).toBe(300);
    expect(frames.waiting).toBe(0);
  });

  it("se rinde en vez de esperar para siempre", () => {
    const frames = fakeFrames();
    let top = -1;

    restoreScrollWhenReady(600, {
      viewportHeight: () => 800,
      documentHeight: () => 400,
      scrollTo: (value) => (top = value),
      nextFrame: frames.nextFrame
    });

    frames.tick(40);
    expect(frames.waiting).toBe(0);
    expect(top).toBe(-1);
  });

  it("el cero se aplica sin esperar a nadie", () => {
    const frames = fakeFrames();
    let top = 999;

    restoreScrollWhenReady(0, {
      viewportHeight: () => 800,
      documentHeight: () => 100,
      scrollTo: (value) => (top = value),
      nextFrame: frames.nextFrame
    });

    expect(top).toBe(0);
    expect(frames.waiting).toBe(0);
  });
});
