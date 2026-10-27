import "dotenv/config";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { extraer } from "./metadatos.mjs";
import {
  generarEtapas,
  ordenarTablas,
  validarEsquema,
} from "../src/modelos/presentacion.mjs";
export async function actualizar() {
  let local = {};
  // Solo se reutiliza una configuración explícita del espacio local; nunca almacenes protegidos.
  if (!process.env.MYSQL_USER) {
    try {
      const v = JSON.parse(await readFile(".vscode/settings.json", "utf8"));
      local =
        v["sqltools.connections"].find(
          (c) =>
            c.database === "electrogestion_db" &&
            ["127.0.0.1", "localhost"].includes(c.server),
        ) || {};
    } catch {}
  }
  const usuario = process.env.MYSQL_USER || local.username;
  if (!usuario)
    throw Error("Configura MYSQL_USER en .env con una cuenta de lectura.");
  const esquema = await extraer({
    host: process.env.MYSQL_HOST || local.server || "127.0.0.1",
    port: Number(process.env.MYSQL_PORT || local.port || 3306),
    user: usuario,
    password: process.env.MYSQL_PASSWORD ?? local.password ?? "",
    database: process.env.MYSQL_DATABASE || "electrogestion_db",
  });
  validarEsquema(esquema);
  esquema.orden = ordenarTablas(esquema);
  esquema.etapas = generarEtapas(esquema);
  await mkdir("public", { recursive: true });
  await writeFile(
    "public/esquema_erd.json",
    JSON.stringify(esquema, null, 2) + "\n",
  );
  console.log(
    `Metadatos verificados: ${esquema.tablas.length} tablas, ${esquema.relaciones.length} FK, ${esquema.etapas.length} etapas. Sin registros ni credenciales.`,
  );
  return esquema;
}
if (process.argv[1]?.endsWith("actualizar-esquema.mjs"))
  actualizar().catch((e) => {
    console.error(e.message);
    process.exitCode = 1;
  });
