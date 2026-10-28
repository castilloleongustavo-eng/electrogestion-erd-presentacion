import { useCallback, useEffect, useRef, useState } from "react";
import type { Sesion } from "./useSesion";
import type { EstadoPublico } from "../../modelos/estado";
type Camara = EstadoPublico["camara"];
const INTERVALO = 200;
export function useCamaraCompartida(sesion: Sesion) {
  const actual = useRef(sesion);
  actual.current = sesion;
  const ultima = useRef<Camara | null>(null),
    enCurso = useRef(false),
    temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const generacion = useRef(0),
    ultimaSalida = useRef(0),
    revisionConfirmada = useRef(0),
    montado = useRef(true);
  const procesar = useRef<() => void>(() => {});
  const gestoActivo = useRef(false);
  const [pendiente, setPendiente] = useState(false);
  const estado = sesion.estado;
  const contexto = JSON.stringify([
    sesion.paso,
    estado?.pantalla,
    estado?.foco,
    estado?.tabla,
    estado?.relacion,
    estado?.campo,
    estado?.columnas,
    estado?.enfoque,
  ]);
  const cancelar = useCallback(() => {
    gestoActivo.current = false;
    generacion.current++;
    ultima.current = null;
    clearTimeout(temporizador.current);
    temporizador.current = undefined;
    if (montado.current) setPendiente(false);
  }, []);
  const programar = useCallback((espera: number) => {
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => procesar.current(), espera);
  }, []);
  procesar.current = () => {
    temporizador.current = undefined;
    const s = actual.current;
    if (!ultima.current || !montado.current) return;
    if (!s.conectado) {
      cancelar();
      return;
    }
    // Una sola escritura a la vez, esperando su revisión confirmada antes
    // de publicar el último movimiento acumulado durante la petición.
    if (
      enCurso.current ||
      s.enviando ||
      (s.estado?.revision || 0) < revisionConfirmada.current
    ) {
      programar(40);
      return;
    }
    const camara = ultima.current,
      turno = generacion.current;
    ultima.current = null;
    enCurso.current = true;
    ultimaSalida.current = performance.now();
    void s
      .ejecutar({ tipo: "camara", camara })
      .then((confirmado) => {
        revisionConfirmada.current = confirmado.revision;
      })
      .catch(() => {
        if (turno === generacion.current) ultima.current = null;
      })
      .finally(() => {
        enCurso.current = false;
        if (!montado.current) return;
        if (ultima.current)
          programar(
            Math.max(0, INTERVALO - (performance.now() - ultimaSalida.current)),
          );
        else if (!gestoActivo.current) setPendiente(false);
      });
  };
  const cambiar = useCallback(
    (camara: Camara, final = false) => {
      if (!actual.current.conectado) return;
      ultima.current = camara;
      setPendiente(true);
      programar(
        final
          ? 0
          : Math.max(0, INTERVALO - (performance.now() - ultimaSalida.current)),
      );
    },
    [programar],
  );
  useEffect(() => {
    cancelar();
  }, [contexto, sesion.conectado, cancelar]);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      clearTimeout(temporizador.current);
      ultima.current = null;
    };
  }, []);
  const interaccion = useCallback((activa: boolean) => {
    gestoActivo.current = activa;
    if (activa) setPendiente(true);
  }, []);
  return { cambiar, pendiente, interaccion };
}
