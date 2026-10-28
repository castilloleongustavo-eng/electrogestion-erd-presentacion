import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Navigate, Route, Routes } from "react-router-dom";
import { Radio, ShieldCheck } from "lucide-react";
import { validarEsquema } from "./modelos/presentacion.mjs";
import type { Esquema } from "./modelos/esquema";
import {
  conectarFirebase,
  type Servicios,
} from "./servicios/sincronizacion/firebase";
import { useSesion } from "./servicios/sincronizacion/useSesion";
import { Control } from "./paginas/control/Control";
import { Presentacion } from "./paginas/presentacion/Presentacion";
import identidad from "./datos/modelo.json";
import "@xyflow/react/dist/style.css";
import "./estilos.css";
import "./estilos/vivo.css";
let recursos: Promise<{ esquema: Esquema; servicios: Servicios }> | undefined;
function cargarRecursos() {
  return (recursos ??= (async () => {
    const r = await fetch(`${import.meta.env.BASE_URL}esquema_erd.json`);
    if (!r.ok) throw Error("No se encontró el esquema real.");
    const contenido = new TextEncoder().encode(
      (await r.text()).replace(/\r\n/g, "\n"),
    );
    const hash = Array.from(
      new Uint8Array(await crypto.subtle.digest("SHA-256", contenido)),
      (b) => b.toString(16).padStart(2, "0"),
    ).join("");
    if (hash !== identidad.hash)
      throw Error("La copia del esquema no coincide con esta compilación.");
    const esquema = JSON.parse(new TextDecoder().decode(contenido));
    validarEsquema(esquema);
    return { esquema, servicios: await conectarFirebase() };
  })());
}
function EnVivo({
  esquema,
  servicios,
}: {
  esquema: Esquema;
  servicios: Servicios;
}) {
  const sesion = useSesion(servicios);
  return (
    <Routes>
      <Route
        path="/control"
        element={
          <Control esquema={esquema} servicios={servicios} sesion={sesion} />
        }
      />
      <Route
        path="/presentacion"
        element={<Presentacion esquema={esquema} sesion={sesion} />}
      />
      <Route path="*" element={<Navigate to="/presentacion" replace />} />
    </Routes>
  );
}
function App() {
  const [datos, setDatos] = useState<{
      esquema: Esquema;
      servicios: Servicios;
    } | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let vigente = true;
    void cargarRecursos()
      .then((r) => {
        if (vigente) setDatos(r);
      })
      .catch((e) => {
        if (vigente) setError(e.message);
      });
    return () => {
      vigente = false;
    };
  }, []);
  if (datos) return <EnVivo {...datos} />;
  const control = location.hash.startsWith("#/control");
  return (
    <div className={`espera-servicio ${control ? "espera-control" : ""}`}>
      <div>
        {control ? <ShieldCheck size={36} /> : <Radio size={36} />}
        <span className="ceja">ELECTROGESTIÓN · PRESENTACIÓN EN VIVO</span>
        <h1>
          {error
            ? "La emisión aún no está disponible"
            : "Conectando con el escenario…"}
        </h1>
        <p>{error || "Preparando el modelo relacional."}</p>
        {control && error && (
          <small>
            Revisa la configuración de Firebase y el manual de puesta en marcha.
          </small>
        )}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
