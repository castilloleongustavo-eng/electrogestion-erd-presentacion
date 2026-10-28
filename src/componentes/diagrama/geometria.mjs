// La cámara comparte centro normalizado y un factor sobre el encuadre local.
// Nunca comparte píxeles del teléfono con el proyector.
export function escalaDeEncuadre(bounds, ancho, alto) {
  const margen = 0.84;
  return Math.min(
    (ancho * margen) / Math.max(bounds.width, 300),
    (alto * margen) / Math.max(bounds.height, 100),
  );
}
export function calcularCamara(bounds, ancho, alto, camara) {
  const zoom = escalaDeEncuadre(bounds, ancho, alto) * camara.zoom;
  const centroX = bounds.x + bounds.width * camara.x,
    centroY = bounds.y + bounds.height * camara.y;
  return { x: ancho / 2 - centroX * zoom, y: alto / 2 - centroY * zoom, zoom };
}
// Inversa del encuadre: convierte gestos locales a los campos ya admitidos
// por las reglas. No se publican píxeles ni se amplían los rangos de Firebase.
export function normalizarCamara(viewport, bounds, ancho, alto) {
  const limitar = (n, min, max) => Math.min(max, Math.max(min, n));
  return {
    x: limitar(
      ((ancho / 2 - viewport.x) / viewport.zoom - bounds.x) /
        Math.max(bounds.width, 1),
      0,
      1,
    ),
    y: limitar(
      ((alto / 2 - viewport.y) / viewport.zoom - bounds.y) /
        Math.max(bounds.height, 1),
      0,
      1,
    ),
    zoom: limitar(
      viewport.zoom / escalaDeEncuadre(bounds, ancho, alto),
      0.25,
      4,
    ),
  };
}
