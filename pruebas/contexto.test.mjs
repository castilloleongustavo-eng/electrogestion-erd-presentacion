import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { generarEtapas } from "../src/modelos/presentacion.mjs";
import { describirEtapa } from "../src/modelos/contexto.mjs";
import {
  calcularCamara,
  normalizarCamara,
  escalaDeEncuadre,
} from "../src/componentes/diagrama/geometria.mjs";
const esquema = JSON.parse(await readFile("public/esquema_erd.json", "utf8"));
test("las 259 etapas tienen contexto y objetivos con elementos reales", () => {
  const etapas = generarEtapas(esquema);
  assert.equal(etapas.length, 259);
  for (const etapa of etapas) {
    const contexto = describirEtapa(esquema, etapa);
    assert.ok(contexto.descripcion.length);
    assert.ok(contexto.objetivo.length);
    for (const nombre of contexto.tablas)
      assert.ok(esquema.tablas.some((t) => t.nombre === nombre));
    for (const campo of contexto.campos) {
      const [tabla, columna] = campo.split(".");
      assert.ok(
        esquema.tablas
          .find((t) => t.nombre === tabla)
          ?.columnas.some((c) => c.nombre === columna),
      );
    }
    for (const nombre of contexto.relaciones)
      assert.ok(esquema.relaciones.some((r) => r.nombre === nombre));
  }
});
test("el contexto reconstruye la misma explicación al retroceder", () => {
  const etapas = generarEtapas(esquema),
    ida = etapas.map((e) => describirEtapa(esquema, e));
  for (let i = etapas.length - 1; i >= 0; i--)
    assert.deepEqual(describirEtapa(esquema, etapas[i]), ida[i]);
});
test("gestos y cámara normalizada conservan centro y factor en teléfono y proyector", () => {
  const bounds = { x: 180, y: -75, width: 300, height: 170 };
  for (const [ancho, alto] of [
    [390, 400],
    [1280, 720],
    [3840, 2160],
  ])
    for (const zoom of [0.25, 1, 4]) {
      const camara = { x: 0.27, y: 0.81, zoom },
        viewport = calcularCamara(bounds, ancho, alto, camara),
        inversa = normalizarCamara(viewport, bounds, ancho, alto);
      for (const clave of ["x", "y", "zoom"])
        assert.ok(Math.abs(camara[clave] - inversa[clave]) < 1e-9);
      assert.ok(
        Math.abs(viewport.zoom / escalaDeEncuadre(bounds, ancho, alto) - zoom) <
          1e-9,
      );
    }
});
test("un arrastre extremo conserva los rangos ya autorizados por Firebase", () => {
  const c = normalizarCamara(
    { x: 50000, y: -50000, zoom: 100 },
    { x: 0, y: 0, width: 100, height: 100 },
    390,
    400,
  );
  assert.ok(
    c.x >= 0 &&
      c.x <= 1 &&
      c.y >= 0 &&
      c.y <= 1 &&
      c.zoom >= 0.25 &&
      c.zoom <= 4,
  );
});
