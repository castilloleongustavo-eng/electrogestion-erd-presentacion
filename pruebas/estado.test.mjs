import test from "node:test";
import assert from "node:assert/strict";
import {
  crearEstado,
  aplicarCambio,
  pasoEnTiempo,
  aceptarVersion,
  SESION,
  RUTA_PUBLICA,
} from "../src/modelos/estado.mjs";
import { calcularCamara } from "../src/componentes/diagrama/geometria.mjs";
test("el identificador y la ruta global son únicos", () => {
  assert.equal(SESION, "electrogestion");
  assert.equal(RUTA_PUBLICA, "sesiones/electrogestion/publico");
});
test("reproducción compartida calcula la etapa al incorporarse tarde", () => {
  const estado = crearEstado("modelo", 10000, "presentador");
  const reproduciendo = aplicarCambio(
    estado,
    { tipo: "reproducir" },
    10000,
    259,
    "presentador",
  );
  assert.equal(pasoEnTiempo(reproduciendo, 18400, 259), 3);
  const pausa = aplicarCambio(
    reproduciendo,
    { tipo: "pausar" },
    18400,
    259,
    "presentador",
  );
  assert.equal(pausa.paso, 3);
  assert.equal(pasoEnTiempo(pausa, 999999, 259), 3);
  assert.equal(pasoEnTiempo(reproduciendo, 999999999, 259), 258);
});
test("un evento antiguo nunca reemplaza una revisión nueva", () => {
  const e = crearEstado("modelo", 10000, "presentador");
  const n = aplicarCambio(e, { tipo: "siguiente" }, 10001, 259, "presentador");
  assert.equal(aceptarVersion(n, e), n);
  assert.equal(aceptarVersion(n, n), n);
  assert.equal(aceptarVersion(e, n), n);
});
test("navegación conserva columnas, relaciones y produce el mismo paso al volver", () => {
  const e = crearEstado("modelo", 10000, "presentador");
  const a = aplicarCambio(e, { tipo: "siguiente" }, 10001, 259, "presentador");
  const b = aplicarCambio(a, { tipo: "anterior" }, 10002, 259, "presentador");
  assert.equal(b.paso, e.paso);
  assert.equal(b.columnas, e.columnas);
  assert.equal(b.relaciones, e.relaciones);
  assert.equal(b.revision, 3);
});
test("cambiar zoom conserva el reloj de reproducción", () => {
  const e = aplicarCambio(
    crearEstado("modelo", 10000, "presentador"),
    { tipo: "reproducir" },
    10000,
    259,
    "presentador",
  );
  const nuevo = aplicarCambio(
    e,
    { tipo: "camara", camara: { zoom: 2 } },
    12800,
    259,
    "presentador",
  );
  assert.deepEqual(nuevo.reproduccion, e.reproduccion);
  assert.equal(pasoEnTiempo(nuevo, 15600, 259), 2);
});
test("cámara proporcional centra el mismo punto a resoluciones distintas", () => {
  const bounds = { x: 100, y: 200, width: 1000, height: 500 },
    camara = { x: 0.5, y: 0.5, zoom: 1 };
  for (const [w, h] of [
    [390, 250],
    [1920, 1080],
    [1280, 720],
  ]) {
    const c = calcularCamara(bounds, w, h, camara);
    assert.ok(Math.abs(c.x + 600 * c.zoom - w / 2) < 0.001);
    assert.ok(Math.abs(c.y + 450 * c.zoom - h / 2) < 0.001);
  }
});
test("estado público no admite acciones de notas privadas ni opciones arbitrarias", () => {
  const e = crearEstado("modelo", 10000, "presentador");
  assert.throws(() =>
    aplicarCambio(
      e,
      { tipo: "opcion", campo: "notas", valor: true },
      10001,
      259,
      "presentador",
    ),
  );
  assert.ok(!("notas" in e));
});
