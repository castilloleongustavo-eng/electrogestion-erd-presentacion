import { chromium, expect } from "@playwright/test";
import "firebase/compat/database";
import { initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { readFile, mkdir } from "node:fs/promises";
import { createServer } from "node:http";
import { resolve, extname, sep } from "node:path";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const proyecto = "demo-electrogestion",
  origen = "http://127.0.0.1:4180/electrogestion-erd-presentacion/";
const publico = "sesiones/electrogestion/publico";
const identidad = JSON.parse(await readFile("src/datos/modelo.json", "utf8"));
const config = {
  habilitado: true,
  apiKey: "demo-api-key",
  authDomain: `${proyecto}.firebaseapp.com`,
  projectId: proyecto,
  databaseURL: `https://${proyecto}.firebaseio.com`,
  appId: "1:123:web:emulador",
};
const entorno = await initializeTestEnvironment({
  projectId: proyecto,
  database: {
    host: "127.0.0.1",
    port: 9000,
    rules: await readFile("firebase/database.rules.json", "utf8"),
  },
});
const email = `presentador-${randomUUID()}@ejemplo.test`,
  password = randomUUID();
const registro = await fetch(
  "http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=demo-api-key",
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  },
);
if (!registro.ok)
  throw Error("No se pudo crear la identidad temporal en el emulador Auth.");
const { localId: uid } = await registro.json();
await entorno.clearDatabase();
await entorno.withSecurityRulesDisabled(async (c) => {
  await c.database().ref("autorizacion").set({
    presentadorUid: uid,
    modelo: identidad.hash,
    totalEtapas: identidad.totalEtapas,
  });
});
const raiz = resolve("dist-pruebas");
const servidor = createServer(async (req, res) => {
  try {
    const ruta = decodeURIComponent(
      new URL(req.url, "http://127.0.0.1").pathname,
    );
    if (ruta.endsWith("/firebase-config.json")) {
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(config));
      return;
    }
    const relativa =
      ruta.replace(/^\/electrogestion-erd-presentacion\//, "") || "index.html";
    const archivo = resolve(raiz, relativa);
    if (!archivo.startsWith(raiz + sep)) {
      res.writeHead(403).end();
      return;
    }
    const datos = await readFile(archivo);
    res.setHeader(
      "Content-Type",
      {
        ".html": "text/html",
        ".js": "text/javascript",
        ".css": "text/css",
        ".json": "application/json",
      }[extname(archivo)] || "application/octet-stream",
    );
    res.end(datos);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => servidor.listen(4180, "127.0.0.1", r));
const b = await chromium.launch();
let codigoError;
try {
  const controlador = await b.newContext({
      viewport: { width: 390, height: 844 },
    }),
    espectador = await b.newContext({
      viewport: { width: 1920, height: 1080 },
    }),
    tardio = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const control = await controlador.newPage(),
    pantalla = await espectador.newPage(),
    tercera = await tardio.newPage();
  const errores = [];
  for (const p of [control, pantalla, tercera])
    p.on("pageerror", (e) => errores.push(e.message));
  await control.goto(origen + "#/control");
  await pantalla.goto(origen + "#/presentacion");
  await expect(
    control.getByRole("button", { name: "Continuar con Google" }),
  ).toBeVisible();
  await expect(
    control.getByRole("button", { name: "Siguiente", exact: true }),
  ).toHaveCount(0);
  await control.getByRole("textbox", { name: "Correo de prueba" }).fill(email);
  await control.getByLabel("Contraseña de prueba").fill(password);
  await control.getByRole("button", { name: "Entrar al emulador" }).click();
  await control
    .getByRole("button", { name: "Inicializar sesión global" })
    .click();
  await expect(
    control.getByRole("button", { name: "Siguiente", exact: true }),
  ).toBeEnabled();
  const estado = async () =>
    await (
      await fetch(`http://127.0.0.1:9000/${publico}.json?ns=${proyecto}`)
    ).json();
  const paso = () =>
    pantalla.locator(".diagrama-vivo").getAttribute("data-paso");
  async function cambiar(accion) {
    const anterior = (await estado()).revision;
    await accion();
    await expect.poll(async () => (await estado()).revision).toBe(anterior + 1);
    await expect
      .poll(async () =>
        Number(
          await pantalla
            .locator(".diagrama-vivo")
            .getAttribute("data-revision"),
        ),
      )
      .toBe(anterior + 1);
  }
  await cambiar(() =>
    control.getByRole("button", { name: "Siguiente", exact: true }).click(),
  );
  await expect.poll(paso).toBe("1");
  await cambiar(() =>
    control.getByRole("button", { name: "Siguiente", exact: true }).click(),
  );
  await expect.poll(paso).toBe("2");
  await expect(pantalla.locator(".fila")).toHaveCount(1);
  await cambiar(() =>
    control.getByRole("button", { name: "Anterior", exact: true }).click(),
  );
  await expect.poll(paso).toBe("1");
  await expect(pantalla.locator(".fila")).toHaveCount(0);
  await cambiar(() =>
    control.getByRole("button", { name: "Acercar zoom", exact: true }).click(),
  );
  assert.equal((await estado()).camara.zoom, 1.25);
  await cambiar(() =>
    control.getByRole("button", { name: "Alejar zoom", exact: true }).click(),
  );
  assert.equal((await estado()).camara.zoom, 1);
  await cambiar(() =>
    control
      .locator(".entidades-control button")
      .filter({ hasText: "producto" })
      .click(),
  );
  assert.equal((await estado()).tabla, "producto");
  await cambiar(() =>
    control
      .getByLabel("Resaltar campo", { exact: true })
      .selectOption("id_producto"),
  );
  assert.equal((await estado()).campo, "id_producto");
  await expect(pantalla.locator(".resaltada")).not.toHaveCount(0);
  await cambiar(() =>
    control
      .getByLabel("Resaltar relación", { exact: true })
      .selectOption({ index: 1 }),
  );
  await expect(pantalla.locator(".resaltada")).not.toHaveCount(0);
  await cambiar(() =>
    control.getByRole("checkbox", { name: "Columnas", exact: true }).uncheck(),
  );
  await expect(pantalla.locator(".fila")).toHaveCount(0);
  await cambiar(() =>
    control.getByRole("checkbox", { name: "Columnas", exact: true }).check(),
  );
  await expect(pantalla.locator(".fila")).not.toHaveCount(0);
  await cambiar(() =>
    control
      .getByRole("checkbox", { name: "Relaciones", exact: true })
      .uncheck(),
  );
  await expect(pantalla.locator(".react-flow__edge")).toHaveCount(0);
  await cambiar(() =>
    control.getByRole("checkbox", { name: "Relaciones", exact: true }).check(),
  );
  const nota = `Apunte privado ${randomUUID()}`;
  await control.getByLabel("Notas privadas del presentador").fill(nota);
  await control.getByRole("button", { name: "Guardar nota" }).click();
  await expect(
    control.getByText("Guardado en tu espacio privado", { exact: true }),
  ).toBeVisible();
  assert.ok(!JSON.stringify(await estado()).includes(nota));
  const privado = await fetch(
    `http://127.0.0.1:9000/privado/electrogestion/notas.json?ns=${proyecto}`,
  );
  assert.equal(privado.status, 401);
  const ataque = await fetch(
    `http://127.0.0.1:9000/${publico}.json?ns=${proyecto}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await estado()),
    },
  );
  assert.equal(ataque.status, 401);
  await tercera.goto(origen + "#/presentacion");
  await expect
    .poll(async () =>
      Number(
        await tercera.locator(".diagrama-vivo").getAttribute("data-revision"),
      ),
    )
    .toBe((await estado()).revision);
  await pantalla.reload();
  await expect
    .poll(async () =>
      Number(
        await pantalla.locator(".diagrama-vivo").getAttribute("data-revision"),
      ),
    )
    .toBe((await estado()).revision);
  await espectador.setOffline(true);
  await cambiarSinEspectador();
  async function cambiarSinEspectador() {
    const r = (await estado()).revision;
    await control
      .getByRole("button", { name: "Siguiente", exact: true })
      .click();
    await expect.poll(async () => (await estado()).revision).toBe(r + 1);
  }
  await espectador.setOffline(false);
  await expect
    .poll(
      async () =>
        Number(
          await pantalla
            .locator(".diagrama-vivo")
            .getAttribute("data-revision"),
        ),
      { timeout: 20000 },
    )
    .toBe((await estado()).revision);
  await controlador.setOffline(true);
  await expect(
    control.getByRole("button", { name: "Siguiente", exact: true }),
  ).toBeDisabled({ timeout: 20000 });
  await controlador.setOffline(false);
  await expect(
    control.getByRole("button", { name: "Siguiente", exact: true }),
  ).toBeEnabled({ timeout: 20000 });
  await cambiar(() =>
    control
      .getByRole("button", { name: "Reproducción automática", exact: true })
      .click(),
  );
  const antesAuto = Number(await paso());
  await expect
    .poll(async () => Number(await paso()), { timeout: 10000 })
    .toBeGreaterThan(antesAuto);
  await cambiar(() =>
    control
      .getByRole("button", { name: "Pausar reproducción", exact: true })
      .click(),
  );
  await cambiar(() =>
    control
      .getByRole("button", { name: "Diagrama completo", exact: true })
      .click(),
  );
  await expect(pantalla.locator(".react-flow__node")).toHaveCount(23);
  await expect(pantalla.locator(".fila")).toHaveCount(174);
  await expect(pantalla.locator(".react-flow__edge")).toHaveCount(30);
  await expect(
    pantalla.locator("button,input,select,textarea,nav"),
  ).toHaveCount(0);
  assert.ok(!(await pantalla.content()).includes(nota));
  assert.ok(
    await control.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  assert.deepEqual(errores, []);
  await mkdir("privado", { recursive: true });
  await control.screenshot({
    path: "privado/control-movil-vivo.png",
    fullPage: true,
  });
  await pantalla.screenshot({ path: "privado/presentacion-viva.png" });
  console.log(
    "Sincronización verificada con Firebase Auth/RTDB emulados y tres contextos independientes: navegación, zoom, selección, relaciones, columnas, notas, incorporación tardía, recarga, desconexión, reconexión, reproducción y pantalla pública sin controles.",
  );
} catch (e) {
  codigoError = e;
} finally {
  await b.close();
  await entorno.cleanup();
  await new Promise((r) => servidor.close(r));
}
if (codigoError) throw codigoError;
