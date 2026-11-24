import { Component, type ReactNode } from "react";

/**
 * Red de seguridad de las pantallas que se cargan al entrar en ellas.
 *
 * Si el telefono pierde la red justo al cambiar de seccion, el trozo de codigo
 * no llega y React desmonta el arbol: sin esto, pantalla en blanco y a reiniciar
 * la app. Tiene que ser una clase porque React solo deja atrapar errores de
 * renderizado asi.
 */
export class ChunkBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override render() {
    if (!this.state.failed) return this.props.children;

    return (
      <section className="chunk-error" role="alert">
        <h2>No pudimos cargar esta sección</h2>
        <p>Revisa tu conexión e inténtalo otra vez. Lo que ya registraste sigue guardado.</p>
        <button className="primary" onClick={() => window.location.reload()}>
          Reintentar
        </button>
      </section>
    );
  }
}
