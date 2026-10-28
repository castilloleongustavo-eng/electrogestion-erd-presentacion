import { readFile, writeFile } from "node:fs/promises";
const variable = process.env.FIREBASE_WEB_CONFIG;
const config = JSON.parse(
  variable || (await readFile("public/firebase-config.json", "utf8")),
);
if (config.habilitado !== true)
  throw Error(
    "Publicación bloqueada: Firebase aún no está configurado y verificado.",
  );
for (const campo of [
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "appId",
])
  if (typeof config[campo] !== "string" || !config[campo].length)
    throw Error(`Falta ${campo} en FIREBASE_WEB_CONFIG.`);
if (
  config.projectId.startsWith("demo-") ||
  !config.databaseURL.startsWith("https://") ||
  !config.authDomain.endsWith(".firebaseapp.com")
)
  throw Error(
    "No se permite publicar una configuración de emulador o inválida.",
  );
const permitidos = [
  "habilitado",
  "apiKey",
  "authDomain",
  "databaseURL",
  "projectId",
  "appId",
];
if (Object.keys(config).some((k) => !permitidos.includes(k)))
  throw Error(
    "La configuración web contiene campos inesperados. No incluyas credenciales privadas.",
  );
await writeFile(
  "public/firebase-config.json",
  JSON.stringify(config, null, 2) + "\n",
);
console.log(
  `Configuración web validada para ${config.projectId}; no contiene credenciales administrativas.`,
);
