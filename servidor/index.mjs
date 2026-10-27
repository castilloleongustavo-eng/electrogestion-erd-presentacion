import express from "express";
import { actualizar } from "./actualizar-esquema.mjs";
const app = express();
app.get("/api/esquema", async (_req, res) => {
  try {
    res.json(await actualizar());
  } catch {
    res
      .status(503)
      .json({
        error: "No se pudo consultar el esquema local. Revisa .env y MySQL.",
      });
  }
});
app.listen(3001, "127.0.0.1", () =>
  console.log("Servicio local de metadatos: http://127.0.0.1:3001/api/esquema"),
);
