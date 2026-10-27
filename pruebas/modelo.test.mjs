import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  generarEtapas,
  validarEsquema,
  ordenarTablas,
} from "../src/modelos/presentacion.mjs";
const esquema = JSON.parse(
  await readFile(
    new URL("../public/esquema_erd.json", import.meta.url),
    "utf8",
  ),
);
test("todas las relaciones reales tienen extremos existentes", () =>
  assert.equal(validarEsquema(esquema), true));
test("el recorrido completo revela exactamente las tablas, columnas y FK reales", () => {
  const etapas = generarEtapas(esquema),
    final = etapas.at(-1);
  assert.equal(etapas[0].tablas.length, 0);
  assert.equal(final.tablas.length, esquema.tablas.length);
  assert.equal(final.relaciones.length, esquema.relaciones.length);
  esquema.tablas.forEach((t) =>
    assert.equal(final.columnas[t.nombre], t.columnas.length),
  );
  etapas.forEach((e) => {
    e.relaciones.forEach((id) => {
      const r = esquema.relaciones.find((r) => r.id === id);
      assert.ok(e.tablas.includes(r.origen) && e.tablas.includes(r.destino));
    });
  });
});
test("retroceder restaura cada estado sin mutación", () => {
  const etapas = generarEtapas(esquema),
    capturas = etapas.map((e) => JSON.stringify(e));
  for (let i = etapas.length - 1; i >= 0; i--)
    assert.equal(JSON.stringify(etapas[i]), capturas[i]);
  assert.deepEqual(generarEtapas(esquema), etapas);
});
test("orden de dependencias y orden manual conservan todas las relaciones", () => {
  const orden = ordenarTablas(esquema);
  assert.equal(new Set(orden).size, esquema.tablas.length);
  const invertido = [...orden].reverse(),
    etapas = generarEtapas(esquema, invertido);
  assert.equal(etapas[1].tabla, invertido[0]);
  assert.equal(etapas.at(-1).relaciones.length, esquema.relaciones.length);
});
test("los metadatos publicables no contienen secretos ni registros", () => {
  assert.doesNotMatch(
    JSON.stringify(esquema),
    /"(?:password|MYSQL_PASSWORD|rows|registros|connectionString)"\s*:/i,
  );
});
