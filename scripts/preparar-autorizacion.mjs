import { readFile, writeFile, mkdir } from "node:fs/promises";
const uid = process.argv[2];
if (!uid || !/^[a-zA-Z0-9_-]{1,128}$/.test(uid))
  throw Error(
    "Indica el UID real autorizado: node scripts/preparar-autorizacion.mjs UID",
  );
const identidad = JSON.parse(await readFile("src/datos/modelo.json", "utf8"));
await mkdir("privado", { recursive: true });
await writeFile(
  "privado/autorizacion.json",
  JSON.stringify(
    {
      presentadorUid: uid,
      modelo: identidad.hash,
      totalEtapas: identidad.totalEtapas,
    },
    null,
    2,
  ) + "\n",
);
console.log(
  "Preparado privado/autorizacion.json. Revisa el proyecto y las reglas antes de aplicarlo; este comando no configura servicios externos.",
);
