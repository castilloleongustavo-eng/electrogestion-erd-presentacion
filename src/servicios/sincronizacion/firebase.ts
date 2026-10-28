import { initializeApp } from "firebase/app";
import {
  getAuth,
  connectAuthEmulator,
  browserSessionPersistence,
  setPersistence,
} from "firebase/auth";
import { getDatabase, connectDatabaseEmulator } from "firebase/database";
export async function conectarFirebase() {
  const r = await fetch(`${import.meta.env.BASE_URL}firebase-config.json`, {
    cache: "no-store",
  });
  if (!r.ok)
    throw Error("No se encontró la configuración del servicio en vivo.");
  const config = await r.json();
  if (config.habilitado !== true)
    throw Error("La presentación en vivo todavía no está configurada.");
  const { apiKey, authDomain, databaseURL, projectId, appId } = config;
  if (
    ![apiKey, authDomain, databaseURL, projectId, appId].every(
      (v) => typeof v === "string" && v.length,
    )
  )
    throw Error("La configuración de Firebase está incompleta.");
  const pruebas =
    import.meta.env.MODE === "pruebas" &&
    ["127.0.0.1", "localhost"].includes(location.hostname) &&
    projectId === "demo-electrogestion";
  if (
    !pruebas &&
    (!databaseURL.startsWith("https://") ||
      !authDomain.endsWith(".firebaseapp.com") ||
      !/^https:\/\/[a-zA-Z0-9-]+\.(?:firebaseio\.com|[a-z0-9-]+\.firebasedatabase\.app)\/?$/.test(
        databaseURL,
      ))
  )
    throw Error("La configuración no apunta a servicios Firebase válidos.");
  const app = initializeApp({
    apiKey,
    authDomain,
    databaseURL,
    projectId,
    appId,
  });
  const auth = getAuth(app),
    db = getDatabase(app);
  if (pruebas) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", {
      disableWarnings: true,
    });
    connectDatabaseEmulator(db, "127.0.0.1", 9000);
  }
  await setPersistence(auth, browserSessionPersistence);
  return { auth, db, pruebas };
}
export type Servicios = Awaited<ReturnType<typeof conectarFirebase>>;
