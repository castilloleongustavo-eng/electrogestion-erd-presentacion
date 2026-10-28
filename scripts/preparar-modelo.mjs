import { readFile, writeFile, mkdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { generarEtapas, validarEsquema } from "../src/modelos/presentacion.mjs";
const bytes = (await readFile("public/esquema_erd.json", "utf8")).replace(
  /\r\n/g,
  "\n",
);
const esquema = JSON.parse(bytes);
validarEsquema(esquema);
const identidad = {
  hash: createHash("sha256").update(bytes).digest("hex"),
  totalEtapas: generarEtapas(esquema).length,
};
await mkdir("src/datos", { recursive: true });
await writeFile(
  "src/datos/modelo.json",
  JSON.stringify(identidad, null, 2) + "\n",
);
console.log(
  `Modelo conservado: ${esquema.tablas.length} tablas, ${identidad.totalEtapas} etapas.`,
);
