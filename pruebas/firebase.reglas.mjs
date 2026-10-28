import { test, before, after, beforeEach } from "node:test";
import "firebase/compat/database";
import { readFile } from "node:fs/promises";
import {
  initializeTestEnvironment,
  assertSucceeds,
  assertFails,
} from "@firebase/rules-unit-testing";
import { crearEstado } from "../src/modelos/estado.mjs";
const proyecto = "demo-electrogestion";
const modelo = JSON.parse(await readFile("src/datos/modelo.json", "utf8"));
let entorno;
before(async () => {
  entorno = await initializeTestEnvironment({
    projectId: proyecto,
    database: {
      host: "127.0.0.1",
      port: 9000,
      rules: await readFile("firebase/database.rules.json", "utf8"),
    },
  });
});
after(async () => {
  await entorno?.cleanup();
});
beforeEach(async () => {
  await entorno.clearDatabase();
  await entorno.withSecurityRulesDisabled(async (c) => {
    await c
      .database()
      .ref("autorizacion")
      .set({
        presentadorUid: "propietario",
        modelo: modelo.hash,
        totalEtapas: modelo.totalEtapas,
      });
    await c
      .database()
      .ref("sesiones/electrogestion/publico")
      .set(crearEstado(modelo.hash, Date.now(), "propietario"));
    await c
      .database()
      .ref("privado/electrogestion/notas/0")
      .set("Nota estrictamente privada");
  });
});
const publico = "sesiones/electrogestion/publico";
test("espectador lee únicamente el estado público y nunca notas/configuración/raíz", async () => {
  const db = entorno.unauthenticatedContext().database();
  await assertSucceeds(db.ref(publico).get());
  await assertFails(db.ref("privado/electrogestion/notas").get());
  await assertFails(db.ref("privado/electrogestion/notas/0").get());
  await assertFails(db.ref("autorizacion").get());
  await assertFails(db.ref().get());
});
test("anónimo y usuario distinto no pueden controlar ni consultar notas", async () => {
  for (const contexto of [
    entorno.unauthenticatedContext(),
    entorno.authenticatedContext("intruso"),
  ]) {
    const db = contexto.database();
    await assertFails(
      db.ref(publico).set(crearEstado(modelo.hash, Date.now(), "intruso")),
    );
    await assertFails(db.ref("privado/electrogestion/notas/0").set("invasión"));
    await assertFails(db.ref("privado/electrogestion/notas/0").get());
  }
});
test("solo propietario consulta autorización y escribe una siguiente revisión válida", async () => {
  const db = entorno.authenticatedContext("propietario").database();
  await assertSucceeds(db.ref("autorizacion/presentadorUid").get());
  const n = {
    ...crearEstado(modelo.hash, Date.now(), "propietario"),
    revision: 2,
    paso: 1,
  };
  await assertSucceeds(db.ref(publico).set(n));
  await assertSucceeds(
    db.ref("privado/electrogestion/notas/1").set("Apunte privado"),
  );
  await assertSucceeds(db.ref("privado/electrogestion/notas/1").get());
});
test("ni el propietario puede autorizar otra cuenta, borrar la sesión o crear otra", async () => {
  const db = entorno.authenticatedContext("propietario").database();
  await assertFails(db.ref("autorizacion/presentadorUid").set("intruso"));
  await assertFails(db.ref(publico).remove());
  await assertFails(
    db
      .ref("sesiones/otra/publico")
      .set(crearEstado(modelo.hash, Date.now(), "propietario")),
  );
  await assertFails(db.ref("privado/otra/notas/0").set("extra"));
});
test("se rechazan revisiones antiguas, saltos, valores fuera de rango y campos públicos extra", async () => {
  const db = entorno.authenticatedContext("propietario").database();
  const n = {
    ...crearEstado(modelo.hash, Date.now(), "propietario"),
    revision: 2,
  };
  for (const cambio of [
    { revision: 1 },
    { revision: 99 },
    { paso: 259 },
    { paso: -1 },
    { paso: 1.5 },
    { modelo: "otro" },
    { columnas: "true" },
    { solicitadoEn: Date.now() - 60000 },
    { notas: "privado" },
    { camara: { x: 0.5, y: 0.5, zoom: 99 } },
  ])
    await assertFails(db.ref(publico).set({ ...n, ...cambio }));
});
test("una revisión confirmada impide sobrescribir con un comando anterior", async () => {
  const db = entorno.authenticatedContext("propietario").database();
  const n = {
    ...crearEstado(modelo.hash, Date.now(), "propietario"),
    revision: 2,
    paso: 3,
  };
  await assertSucceeds(db.ref(publico).set(n));
  await assertFails(db.ref(publico).set({ ...n, paso: 1 }));
});
