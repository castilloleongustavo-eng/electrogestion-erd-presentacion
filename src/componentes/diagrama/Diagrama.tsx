import { useEffect, useMemo, useRef, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  useReactFlow,
  getNodesBounds,
  type Edge,
} from "@xyflow/react";
import dagre from "@dagrejs/dagre";
import type { Esquema, Columna } from "../../modelos/esquema";
import type { EstadoPublico } from "../../modelos/estado";
import { generarEtapas } from "../../modelos/presentacion.mjs";
import { Entidad, type NodoEntidad } from "../animaciones/Entidad";
import { calcularCamara } from "./geometria.mjs";
const nodeTypes = { entidad: Entidad };
const colores = ["#b4ee87", "#82c5ff", "#c2a5ff", "#ffca83", "#81ddd0"];
export function Diagrama(props: {
  esquema: Esquema;
  estado: EstadoPublico;
  paso: number;
  previa?: boolean;
  seleccionar?: (tabla: string, columna: Columna) => void;
}) {
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
}: {
  esquema: Esquema;
  estado: EstadoPublico;
  paso: number;
  previa?: boolean;
  seleccionar?: (tabla: string, columna: Columna) => void;
}) {
  const flujo = useReactFlow();
  const contenedor = useRef<HTMLDivElement>(null);
  const [medidas, setMedidas] = useState({ width: 1, height: 1 });
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
  useEffect(() => {
    if (!nodos.length) return;
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
    const bounds = getNodesBounds(
      objetivo.map((n) => ({
        ...n,
        width: 300,
        height: 62 + n.data.cantidad * 30,
      })),
    );
    const camara = calcularCamara(
      bounds,
      medidas.width,
      medidas.height,
      estado.camara,
    );
    const t = setTimeout(() => {
      void flujo.setViewport(camara, {
        duration: estado.animaciones ? 350 : 0,
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
  ]);
  return (
    <div
      ref={contenedor}
      className={`diagrama-vivo ${!estado.animaciones ? "sin-animaciones" : ""}`}
      data-paso={paso}
      data-revision={estado.revision}
    >
      <ReactFlow
        nodes={nodos}
        edges={aristas}
        nodeTypes={nodeTypes}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag={false}
        zoomOnScroll={false}
        zoomOnPinch={false}
        zoomOnDoubleClick={false}
        preventScrolling={false}
        minZoom={0.03}
        maxZoom={3}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#30433a" gap={25} size={1} />
      </ReactFlow>
    </div>
  );
}
