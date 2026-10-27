import { chromium } from "@playwright/test";
import { readFile, mkdir } from "node:fs/promises";
import assert from "node:assert/strict";
import { generarEtapas } from "../src/modelos/presentacion.mjs";
const esquema = JSON.parse(await readFile("public/esquema_erd.json", "utf8"));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 1000 },
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const errores = [];
  page.on("pageerror", (e) => errores.push(e.message));
  await page.goto(process.env.PRUEBA_URL || "http://127.0.0.1:4173/electrogestion-erd-presentacion/");
  await page
    .getByRole("button", { name: "Iniciar presentación", exact: true })
    .click();
  assert.equal(await page.locator(".react-flow__node").count(), 0);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  assert.equal(await page.locator(".react-flow__node").count(), 1);
  await page.getByRole("button", { name: "Siguiente", exact: true }).click();
  assert.equal(await page.locator(".fila").count(), 1);
  await page
    .getByRole("button", { name: "Etapa anterior", exact: true })
    .click();
  assert.equal(await page.locator(".fila").count(), 0);
  const etapas = generarEtapas(esquema);
  // Recorre el total del modelo real en ambos sentidos, sin saltar al final.
  // Ejecuta los clics en la página y espera dos cuadros por estado. Evita
  // recalcular el árbol de accesibilidad de todo el ERD en cada interacción.
  await page.evaluate(async (esperados) => {
    async function comprobar(i, selector) {
      document.querySelector(selector).click();
      await new Promise(requestAnimationFrame);
      await new Promise(requestAnimationFrame);
      const entidades=document.querySelectorAll('.react-flow__node').length;
      const columnas=document.querySelectorAll('.fila').length;
      const esperado=esperados[i];
      if(entidades!==esperado.tablas.length || columnas!==Object.values(esperado.columnas).reduce((a,b)=>a+b,0)) throw Error(`Estado incorrecto en etapa ${i}`);
    }
    for(let i=2;i<esperados.length;i++) await comprobar(i,'.siguiente');
    for(let i=esperados.length-2;i>=0;i--) await comprobar(i,'button[aria-label="Etapa anterior"]');
  }, etapas);
  await page
    .getByRole("button", { name: "Diagrama completo", exact: false })
    .click();
  assert.equal(
    await page.locator(".react-flow__node").count(),
    esquema.tablas.length,
  );
  assert.equal(
    await page.locator(".fila").count(),
    esquema.tablas.reduce((n, t) => n + t.columnas.length, 0),
  );
  await page.waitForTimeout(900);
  assert.equal(
    await page.locator(".react-flow__edge").count(),
    esquema.relaciones.reduce((n, r) => n + r.columnas.length, 0),
  );
  await page
    .getByRole("button", { name: "Mostrar u ocultar relaciones", exact: true })
    .click();
  assert.equal(await page.locator(".react-flow__edge").count(), 0);
  await page
    .getByRole("button", { name: "Mostrar u ocultar relaciones", exact: true })
    .click();
  await mkdir("privado", { recursive: true });
  await page.screenshot({
    path: "privado/diagrama-completo.png",
    fullPage: true,
  });
  await page.getByRole("link").first().click();
  await page.screenshot({ path: "privado/bienvenida.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "privado/movil.png", fullPage: true });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  );
  assert.deepEqual(errores, []);
  console.log(
    "Navegador OK: bienvenida, lienzo vacío, avance, retroceso, modelo completo, conexiones, controles y móvil.",
  );
} finally {
  await browser.close();
}
