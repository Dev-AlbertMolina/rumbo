/**
 * "Estas cifras son las del mes anterior, el nuevo viene en camino."
 *
 * Antes eso lo decia solo la penumbra: la pantalla al 55%. Dos problemas con
 * eso. Al 55% el texto sobre papel baja a 3.6:1 y lo apagado a 2.4:1, por
 * debajo de lo legible, justo en las cifras de dinero. Y quien no ve la
 * pantalla no se entera de nada: un lector de pantalla leia las cifras viejas
 * como si fueran las de ahora.
 *
 * Asi que lo dice con palabras, y la penumbra se queda en un gesto.
 */
export function StaleNotice() {
  return (
    <p className="stale-notice" role="status">
      Actualizando…
    </p>
  );
}
