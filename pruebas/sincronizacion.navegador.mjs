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
      hasTouch: true,
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
  // El contexto es privado y está situado entre el lienzo y la navegación.
  await expect(control.getByTestId("titulo-contexto")).toHaveText(
    /Etapa 2 de 259/,
  );
  assert.ok(
    await control.evaluate(() => {
      const columna = document.querySelector(".columna-principal");
      return !!columna.querySelector(
        ".vista-previa + .contexto-etapa + .navegacion-control",
      );
    }),
  );
  await expect(
    control.getByText("Objetivo de la etapa", { exact: true }),
  ).toBeVisible();
  await expect(
    pantalla.locator(".contexto-etapa,.controles-vista"),
  ).toHaveCount(0);
  await cambiar(() =>
    control.getByRole("button", { name: "Acercar zoom", exact: true }).click(),
  );
  assert.equal((await estado()).camara.zoom, 1.25);
  await cambiar(() =>
    control.getByRole("button", { name: "Alejar zoom", exact: true }).click(),
  );
  assert.equal((await estado()).camara.zoom, 1);
  const lienzoControl = control.locator(".previa-lienzo .diagrama-vivo");
  await lienzoControl.scrollIntoViewIfNeeded();
  const area = await lienzoControl.boundingBox();
  assert.ok(area.height >= 340);
  const antesArrastre = await estado();
  await control.mouse.move(area.x + 12, area.y + 12);
  await control.mouse.down();
  await control.mouse.move(area.x + 65, area.y + 48, { steps: 24 });
  await control.mouse.up();
  await expect
    .poll(async () => {
      const e = await estado();
      return (
        Math.abs(e.camara.x - antesArrastre.camara.x) +
        Math.abs(e.camara.y - antesArrastre.camara.y)
      );
    })
    .toBeGreaterThan(0.01);
  await expect(
    control.getByRole("button", { name: "Centrar diagrama", exact: true }),
  ).toBeEnabled();
  await expect
    .poll(async () =>
      Number(
        await pantalla.locator(".diagrama-vivo").getAttribute("data-revision"),
      ),
    )
    .toBe((await estado()).revision);
  assert.ok(
    (await estado()).revision - antesArrastre.revision < 12,
    "El arrastre debe agrupar movimientos, no escribir cada evento.",
  );
  await cambiar(() =>
    control
      .getByRole("button", { name: "Centrar diagrama", exact: true })
      .click(),
  );
  assert.deepEqual((await estado()).camara, { x: 0.5, y: 0.5, zoom: 1 });
  const mano = control.getByRole("button", {
    name: "Herramienta de mano",
    exact: true,
  });
  await mano.click();
  await expect(mano).toHaveAttribute("aria-pressed", "false");
  const sinMano = await estado();
  await control.mouse.move(area.x + 12, area.y + 12);
  await control.mouse.down();
  await control.mouse.move(area.x + 65, area.y + 48, { steps: 10 });
  await control.mouse.up();
  await control.waitForTimeout(300);
  assert.equal((await estado()).revision, sinMano.revision);
  await mano.click();
  const antesRueda = (await estado()).camara.zoom;
  await control.mouse.move(area.x + area.width / 2, area.y + area.height / 3);
  await control.mouse.wheel(0, -120);
  await expect
    .poll(async () => (await estado()).camara.zoom)
    .toBeGreaterThan(antesRueda);
  await expect(
    control.getByRole("button", { name: "Centrar diagrama", exact: true }),
  ).toBeEnabled();
  await cambiar(() =>
    control
      .getByRole("button", { name: "Centrar diagrama", exact: true })
      .click(),
  );
  // Gestos táctiles reales del protocolo de Chromium: arrastre y pellizco.
  const cdp = await controlador.newCDPSession(control);
  await cdp.send("Emulation.setTouchEmulationEnabled", {
    enabled: true,
    maxTouchPoints: 2,
  });
  const centro = { x: area.x + area.width / 2, y: area.y + area.height / 3 };
  const antesTacto = await estado();
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: area.x + 14, y: area.y + 14, id: 0 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchMove",
    touchPoints: [{ x: area.x + 58, y: area.y + 38, id: 0 }],
  });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => {
      const e = await estado();
      return (
        Math.abs(e.camara.x - antesTacto.camara.x) +
        Math.abs(e.camara.y - antesTacto.camara.y)
      );
    })
    .toBeGreaterThan(0.01);
  await expect(
    control.getByRole("button", { name: "Centrar diagrama", exact: true }),
  ).toBeEnabled();
  await cambiar(() =>
    control
      .getByRole("button", { name: "Centrar diagrama", exact: true })
      .click(),
  );
  const antesPellizco = (await estado()).camara.zoom;
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [
      { x: centro.x - 25, y: centro.y, id: 0 },
      { x: centro.x + 25, y: centro.y, id: 1 },
    ],
  });
  for (const distancia of [32, 40, 50])
    await cdp.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [
        { x: centro.x - distancia, y: centro.y, id: 0 },
        { x: centro.x + distancia, y: centro.y, id: 1 },
      ],
    });
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  await expect
    .poll(async () => (await estado()).camara.zoom)
    .toBeGreaterThan(antesPellizco);
  await expect(
    control.getByRole("button", { name: "Centrar diagrama", exact: true }),
  ).toBeEnabled();
  // El espectador no puede provocar escrituras ni navegar su propio lienzo.
  const espectadorAntes = await estado();
  await pantalla.mouse.move(200, 200);
  await pantalla.mouse.wheel(0, -200);
  await pantalla.mouse.down();
  await pantalla.mouse.move(280, 250);
  await pantalla.mouse.up();
  await pantalla.keyboard.press("ArrowRight");
  await pantalla.waitForTimeout(300);
  assert.equal((await estado()).revision, espectadorAntes.revision);
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
