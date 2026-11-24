import { Component, type ErrorInfo, type ReactNode } from "react";

/**
 * Los errores que de verdad son "el trozo de codigo no llego".
 *
 * Cada navegador lo dice a su manera, pero todos nombran el modulo o el trozo.
 * Lo que no encaje aqui es una pantalla que se rompio, y entonces hablar de la
 * conexion manda a la persona a arreglar lo que no esta roto.
 */
const CHUNK_FAILURE = /dynamically imported module|loading chunk|importing a module script/i;

/**
 * Red de seguridad de las pantallas que se cargan al entrar en ellas.
 *
 * Si el telefono pierde la red justo al cambiar de seccion, el trozo de codigo
 * no llega y React desmonta el arbol: sin esto, pantalla en blanco y a reiniciar
 * la app. Tiene que ser una clase porque React solo deja atrapar errores de
 * renderizado asi.
 */
export class ChunkBoundary extends Component<
  { children: ReactNode },
  { failed: boolean; offline: boolean }
> {
  override state = { failed: false, offline: false };

  static getDerivedStateFromError(error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return { failed: true, offline: CHUNK_FAILURE.test(message) };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo) {
    // Que quede en la consola del aparato: el aviso de pantalla es para la
    // persona, no para quien tenga que averiguar despues que se rompio.
    console.error("Rumbo: fallo al mostrar una seccion", error, info.componentStack);
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="chunk-error" role="alert">
        <h2>No pudimos mostrar esta sección</h2>
        <p>
          {this.state.offline
            ? "Revisa tu conexión e inténtalo otra vez."
            : "Algo se rompió al dibujarla y ya quedó anotado."}{" "}
          Lo que ya registraste sigue guardado.
        </p>
        <button className="primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </section>
    );
  }
}
