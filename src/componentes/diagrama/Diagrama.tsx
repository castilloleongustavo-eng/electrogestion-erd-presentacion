import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  getNodesBounds,
  type Edge,
  type Viewport,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import type { Esquema, Columna } from "../../modelos/esquema";
import type { EstadoPublico } from "../../modelos/estado";
import { generarEtapas } from "../../modelos/presentacion.mjs";
import { Entidad, type NodoEntidad } from "../animaciones/Entidad";
import {
  calcularCamara,
  normalizarCamara,
  escalaDeEncuadre,
} from "./geometria.mjs";
import { ControlesVista } from "../controles/ControlesVista";
type Camara = EstadoPublico["camara"];
type PropsDiagrama = {
  esquema: Esquema;
  estado: EstadoPublico;
  paso: number;
  previa?: boolean;
  seleccionar?: (tabla: string, columna: Columna) => void;
  cambiarCamara?: (camara: Camara, final?: boolean) => void;
  interaccionCamara?: (activa: boolean) => void;
  centrar?: () => void;
  bloqueado?: boolean;
  camaraPendiente?: boolean;
  centrarBloqueado?: boolean;
};
const nodeTypes = { entidad: Entidad };
const colores = ["#b4ee87", "#82c5ff", "#c2a5ff", "#ffca83", "#81ddd0"];
export function Diagrama(props: PropsDiagrama) {
  return (
    <ReactFlowProvider>
      <Lienzo {...props} />
    </ReactFlowProvider>
  );
}
function Lienzo({
  esquema,
  estado,
  paso,
  previa,
  seleccionar,
  cambiarCamara,
  interaccionCamara,
  centrar,
  bloqueado = false,
  camaraPendiente = false,
  centrarBloqueado = false,
}: PropsDiagrama) {
  const flujo = useReactFlow();
  const contenedor = useRef<HTMLDivElement>(null);
  const [medidas, setMedidas] = useState({ width: 1, height: 1 });
  const [mano, setMano] = useState(true),
    [zoomLocal, setZoomLocal] = useState(estado.camara.zoom);
  const interactivo = !!previa && !!cambiarCamara;
  const movimiento = useRef(false),
    camaraLocal = useRef(estado.camara);
  const etapas = useMemo(() => generarEtapas(esquema), [esquema]);
  const etapa = etapas[paso];
  const relacion = esquema.relaciones.find(
    (r) => r.id === (estado.relacion || etapa.relacion),
  );
  const tabla = estado.tabla || etapa.tabla;
  const { nodos, aristas } = useMemo(() => {
    const grafo = new dagre.graphlib.Graph();
    grafo.setGraph({
      rankdir: "LR",
      nodesep: 85,
      ranksep: 170,
      marginx: 50,
      marginy: 50,
    });
    grafo.setDefaultEdgeLabel(() => ({}));
    // Posiciones constantes: las tablas ya vistas no saltan al revelar atributos.
    esquema.tablas.forEach((t) =>
      grafo.setNode(t.nombre, {
        width: 300,
        height: 62 + t.columnas.length * 30,
      }),
    );
    esquema.relaciones.forEach((r) => grafo.setEdge(r.destino, r.origen));
    dagre.layout(grafo);
    const nombres = estado.pantalla === "inicio" ? [] : etapa.tablas;
    const nodos: NodoEntidad[] = nombres.map((n: string) => {
      const t = esquema.tablas.find((t) => t.nombre === n)!;
      const p = grafo.node(n);
      return {
        id: n,
        type: "entidad",
        position: { x: p.x - 150, y: p.y - p.height / 2 },
        style: {
          "--acento": colores[esquema.tablas.indexOf(t) % colores.length],
        } as React.CSSProperties,
        data: {
          tabla: t,
          cantidad: estado.columnas ? etapa.columnas[n] || 0 : 0,
          activo:
            n === tabla || n === relacion?.origen || n === relacion?.destino,
          resaltados:
            estado.campo && n === estado.tabla
              ? [estado.campo]
              : relacion
                ? n === relacion.origen
                  ? relacion.columnas
                  : n === relacion.destino
                    ? relacion.referencias
                    : []
                : [],
          claves: estado.claves,
          animaciones: estado.animaciones,
          seleccionar: previa ? seleccionar : undefined,
        },
      };
    });
    const aristas: Edge[] =
      estado.relaciones && estado.columnas
        ? esquema.relaciones
            .filter((r) => etapa.relaciones.includes(r.id))
            .flatMap((r) =>
              r.columnas.map((c, i) => ({
                id: r.id + i,
                source: r.origen,
                target: r.destino,
                sourceHandle: c,
                targetHandle: r.referencias[i],
                animated: estado.animaciones,
                type: "smoothstep",
                label: `${r.cardinalidad} · ${r.opcional ? "opcional" : "obligatoria"}`,
                style: {
                  stroke: r.id === relacion?.id ? "#b4ee87" : "#668078",
                  strokeWidth: r.id === relacion?.id ? 2.6 : 1.4,
                },
                labelStyle: { fill: "#dceadb", fontSize: 12 },
                labelBgStyle: { fill: "#17271f" },
              })),
            )
        : [];
    return { nodos, aristas };
  }, [
    esquema,
    etapa,
    estado.pantalla,
    estado.columnas,
    estado.relaciones,
    estado.claves,
    estado.animaciones,
    estado.campo,
    estado.tabla,
    relacion,
    tabla,
    seleccionar,
    previa,
  ]);
  useEffect(() => {
    const el = contenedor.current;
    if (!el) return;
    const ob = new ResizeObserver(([e]) =>
      setMedidas({ width: e.contentRect.width, height: e.contentRect.height }),
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  const bounds = useMemo(() => {
    let objetivo = nodos;
    if (
      estado.foco === "tabla" ||
      (estado.foco === "automatico" && estado.enfoque && !relacion)
    )
      objetivo = nodos.filter((n) => n.id === tabla);
    if (
      estado.foco === "relacion" ||
      (estado.foco === "automatico" && estado.enfoque && relacion)
    )
      objetivo = nodos.filter(
        (n) => n.id === relacion?.origen || n.id === relacion?.destino,
      );
    if (!objetivo.length) objetivo = nodos;
    // Incluye las dimensiones previstas antes de que ReactFlow mida el DOM.
    return getNodesBounds(
      objetivo.map((n) => ({
        ...n,
        width: 300,
        height: 62 + n.data.cantidad * 30,
      })),
    );
  }, [nodos, estado.foco, estado.enfoque, tabla, relacion]);
  const escala = escalaDeEncuadre(bounds, medidas.width, medidas.height);
  const habilitado = interactivo && !bloqueado && nodos.length > 0;
  const contexto = JSON.stringify([
    paso,
    estado.pantalla,
    estado.foco,
    estado.enfoque,
    estado.columnas,
    estado.tabla,
    estado.relacion,
    estado.campo,
  ]);
  const contextoAnterior = useRef(contexto);
  useEffect(() => {
    movimiento.current = false;
  }, [contexto, bloqueado]);
  useEffect(() => {
    if (!nodos.length || movimiento.current || (interactivo && camaraPendiente))
      return;
    const cambioDeEtapa = contextoAnterior.current !== contexto;
    contextoAnterior.current = contexto;
    const camara = calcularCamara(
      bounds,
      medidas.width,
      medidas.height,
      estado.camara,
    );
    const t = setTimeout(() => {
      camaraLocal.current = estado.camara;
      setZoomLocal(estado.camara.zoom);
      void flujo.setViewport(camara, {
        duration: estado.animaciones ? (cambioDeEtapa ? 350 : 160) : 0,
      });
    }, 30);
    return () => clearTimeout(t);
  }, [
    nodos,
    flujo,
    medidas,
    estado.camara,
    estado.foco,
    estado.enfoque,
    estado.animaciones,
    tabla,
    relacion,
    bounds,
    contexto,
    interactivo,
    camaraPendiente,
  ]);
  const comunicar = useCallback(
    (viewport: Viewport, final: boolean) => {
      if (!habilitado) return;
      const normalizada = normalizarCamara(
        viewport,
        bounds,
        medidas.width,
        medidas.height,
      );
      const limitada = calcularCamara(
        bounds,
        medidas.width,
        medidas.height,
        normalizada,
      );
      camaraLocal.current = normalizada;
      setZoomLocal(normalizada.zoom);
      // El centro permanece en el rango normalizado autorizado. El ajuste no
      // genera escrituras recursivas: los eventos programáticos se ignoran.
      if (
        Math.abs(viewport.x - limitada.x) > 0.5 ||
        Math.abs(viewport.y - limitada.y) > 0.5
      )
        void flujo.setViewport(limitada, { duration: 0 });
      cambiarCamara?.(normalizada, final);
    },
    [habilitado, bounds, medidas, flujo, cambiarCamara],
  );
  const acercarAlejar = (factor: number) => {
    const nueva = {
      ...camaraLocal.current,
      zoom: Math.min(4, Math.max(0.25, camaraLocal.current.zoom * factor)),
    };
    camaraLocal.current = nueva;
    setZoomLocal(nueva.zoom);
    void flujo.setViewport(
      calcularCamara(bounds, medidas.width, medidas.height, nueva),
      { duration: 0 },
    );
    cambiarCamara?.(nueva, true);
  };
  return (
    <div
      ref={contenedor}
      className={`diagrama-vivo ${!estado.animaciones ? "sin-animaciones" : ""}`}
      data-paso={paso}
      data-revision={estado.revision}
      data-interactivo={interactivo}
      data-mano={interactivo && mano}
    >
      <ReactFlow
        nodes={nodos}
        edges={aristas}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={habilitado && mano}
        zoomOnScroll={habilitado}
        zoomOnPinch={habilitado}
        zoomOnDoubleClick={false}
        preventScrolling={habilitado}
        minZoom={Math.max(0.0001, escala * 0.25)}
        maxZoom={Math.max(0.0004, escala * 4)}
        onMoveStart={(evento) => {
          if (evento && habilitado) {
            movimiento.current = true;
            interaccionCamara?.(true);
          }
        }}
        onMove={(evento, viewport) => {
          if (evento && movimiento.current) comunicar(viewport, false);
        }}
        onMoveEnd={(evento, viewport) => {
          if (evento && movimiento.current) {
            movimiento.current = false;
            interaccionCamara?.(false);
            comunicar(viewport, true);
          }
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#30433a" gap={25} size={1} />
        {interactivo && (
          <ControlesVista
            mano={mano}
            cambiarMano={() => setMano((v) => !v)}
            zoom={zoomLocal}
            acercar={() => acercarAlejar(1.25)}
            alejar={() => acercarAlejar(0.8)}
            centrar={() => centrar?.()}
            bloqueado={!habilitado}
            centrarBloqueado={centrarBloqueado}
          />
        )}
      </ReactFlow>
    </div>
  );
}
