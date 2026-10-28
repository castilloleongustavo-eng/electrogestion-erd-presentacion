// La cámara comparte centro normalizado y un factor sobre el encuadre local.
// Nunca comparte píxeles del teléfono con el proyector.
export function calcularCamara(bounds, ancho, alto, camara) {
  const margen = 0.84;
  const base = Math.min(
    (ancho * margen) / Math.max(bounds.width, 300),
    (alto * margen) / Math.max(bounds.height, 100),
  );
  const zoom = Math.min(3, Math.max(0.03, base * camara.zoom));
  const centroX = bounds.x + bounds.width * camara.x,
    centroY = bounds.y + bounds.height * camara.y;
  return { x: ancho / 2 - centroX * zoom, y: alto / 2 - centroY * zoom, zoom };
}
