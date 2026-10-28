import { useCallback, useEffect, useState } from "react";
import {
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
} from "firebase/database";
import type { Servicios } from "./firebase";
import type { Cambio, EstadoPublico } from "../../modelos/estado";
import {
  RUTA_PUBLICA,
  aceptarVersion,
  aplicarCambio,
  crearEstado,
  pasoEnTiempo,
} from "../../modelos/estado.mjs";
import identidad from "../../datos/modelo.json";
export function useSesion(servicios: Servicios) {
  const [estado, setEstado] = useState<EstadoPublico | null>(null),
    [conectado, setConectado] = useState(false),
    [cargado, setCargado] = useState(false),
    [error, setError] = useState(""),
    [offset, setOffset] = useState(0),
    [reloj, setReloj] = useState(Date.now());
  const [enviando, setEnviando] = useState(false);
  useEffect(() => {
    const a = onValue(ref(servicios.db, ".info/connected"), (s) =>
      setConectado(s.val() === true),
    );
    const b = onValue(ref(servicios.db, ".info/serverTimeOffset"), (s) =>
      setOffset(Number(s.val()) || 0),
    );
    const c = onValue(
      ref(servicios.db, RUTA_PUBLICA),
      (s) => {
        const nuevo = s.val() as EstadoPublico | null;
        setCargado(true);
        if (!nuevo) {
          setEstado(null);
          return;
        }
        if (nuevo.formato !== 1 || nuevo.modelo !== identidad.hash) {
          setError(
            "El estado en vivo pertenece a otra versión del modelo. Actualiza el esquema autorizado antes de presentar.",
          );
          return;
        }
        setEstado((actual) => aceptarVersion(actual, nuevo) as EstadoPublico);
        setError("");
      },
      () => {
        setError(
          "No se pudo leer la sesión pública. Revisa la conexión y las reglas Firebase.",
        );
        setCargado(true);
      },
    );
    return () => {
      a();
      b();
      c();
    };
  }, [servicios]);
  useEffect(() => {
    if (!estado?.reproduccion.activa) return;
    const t = setInterval(() => setReloj(Date.now()), 100);
    return () => clearInterval(t);
  }, [estado?.reproduccion.activa]);
  const paso = estado
    ? pasoEnTiempo(
        estado,
        Math.max(reloj, Date.now()) + offset,
        identidad.totalEtapas,
      )
    : 0;
  const ejecutar = useCallback(
    async (cambio: Cambio | null) => {
      const usuario = servicios.auth.currentUser;
      if (!usuario || !conectado || enviando)
        throw Error("Necesitas una conexión activa y una cuenta autorizada.");
      const revision = estado?.revision || 0;
      const solicitadoEn = Date.now() + offset;
      setEnviando(true);
      setError("");
      try {
        const r = await runTransaction(
          ref(servicios.db, RUTA_PUBLICA),
          (actual) => {
            if ((actual?.revision || 0) !== revision) return;
            if (!actual) {
              if (cambio !== null) return;
              const inicial = crearEstado(
                identidad.hash,
                solicitadoEn,
                usuario.uid,
              );
              return { ...inicial, actualizadoEn: serverTimestamp() };
            }
            if (cambio === null) return;
            const nuevo = aplicarCambio(
              actual,
              cambio,
              solicitadoEn,
              identidad.totalEtapas,
              usuario.uid,
            );
            return {
              ...nuevo,
              actualizadoEn: serverTimestamp(),
              reproduccion: {
                ...nuevo.reproduccion,
                desdeServidor:
                  cambio.tipo === "reproducir"
                    ? serverTimestamp()
                    : nuevo.reproduccion.desdeServidor,
              },
            };
          },
          { applyLocally: false },
        );
        if (!r.committed)
          throw Error(
            "El estado cambió en otro control. Espera a sincronizar e inténtalo de nuevo.",
          );
      } catch (e) {
        const mensaje =
          e instanceof Error ? e.message : "No se pudo confirmar el cambio.";
        setError(mensaje);
        throw Error(mensaje);
      } finally {
        setEnviando(false);
      }
    },
    [servicios, estado?.revision, conectado, enviando, offset],
  );
  return { estado, paso, conectado, cargado, error, enviando, ejecutar };
}
export type Sesion = ReturnType<typeof useSesion>;
