import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { createRoot } from "react-dom/client";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  useReactFlow,
  type NodeProps,
  type Node,
  type Edge,
} from "@xyflow/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Database,
  ArrowRight,
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  Maximize,
  Search,
  Layers,
  GitBranch,
  KeyRound,
  Link2,
  Download,
  Focus,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
  BookOpen,
  X,
  Check,
  SlidersHorizontal,
} from "lucide-react";
import dagre from "@dagrejs/dagre";
import { toPng, toSvg } from "html-to-image";
import { generarEtapas, validarEsquema } from "./modelos/presentacion.mjs";
import "@xyflow/react/dist/style.css";
import "./estilos.css";

type Columna = {
  nombre: string;
  tipo: string;
  nulo: boolean;
  pk: boolean;
  fk: boolean;
  extra: string;
};
type Tabla = {
  nombre: string;
  columnas: Columna[];
  indices: { nombre: string; unico: boolean; columnas: string[] }[];
};
type Relacion = {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  columnas: string[];
  referencias: string[];
  cardinalidad: string;
  opcional: boolean;
  descripcion: string;
  ejemplo: string;
  reglas: { actualizar: string; eliminar: string };
};
type Esquema = {
  asociaciones: {
    tabla: string;
    extremos: string[];
    cardinalidad: string;
    fundamento: string;
    descripcion: string;
  }[];
  base: string;
  generado: string;
  fuente: string;
  tablas: Tabla[];
  relaciones: Relacion[];
  orden: string[];
};
type DatosNodo = {
  tabla: Tabla;
  cantidad: number;
  activo: boolean;
  resaltados: string[];
  seleccionar: (tabla: string, c: Columna) => void;
};
type Nodo = Node<DatosNodo, "entidad">;
const paleta = ["#b4ee87", "#82c5ff", "#c2a5ff", "#ffca83", "#81ddd0"];
function Entidad({ data }: NodeProps<Nodo>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`entidad ${data.activo ? "activa" : ""}`}
    >
      <header>
        <Database size={15} />
        <strong>{data.tabla.nombre}</strong>
        <span>{data.tabla.columnas.length}</span>
      </header>
      <div className="filas">
        {data.tabla.columnas.slice(0, data.cantidad).map((c) => (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={c.nombre}
            className={`fila ${data.resaltados.includes(c.nombre) ? "resaltada" : ""}`}
            onClick={() => data.seleccionar(data.tabla.nombre, c)}
          >
            <Handle type="target" position={Position.Left} id={c.nombre} />
            <span className={c.pk ? "pk" : c.fk ? "fk" : "neutro"}>
              {c.pk ? (
                <KeyRound size={12} />
              ) : c.fk ? (
                <Link2 size={12} />
              ) : (
                <i />
              )}
            </span>
            <span>{c.nombre}</span>
            <small title={c.tipo}>{c.tipo}</small>
            <Handle type="source" position={Position.Right} id={c.nombre} />
          </motion.button>
        ))}
      </div>
      {data.cantidad === 0 && (
        <p className="sin-columnas">Una entidad del sistema</p>
      )}
    </motion.div>
  );
}
const nodeTypes = { entidad: Entidad };
function leerGuardado() {
  try {
    return JSON.parse(localStorage.getItem("electrogestion-config") || "{}");
  } catch {
    return {};
  }
}
function Aula({ esquema }: { esquema: Esquema }) {
  const guardado = useMemo(leerGuardado, []);
  const [bienvenida, setBienvenida] = useState(true),
    [paso, setPaso] = useState(0),
    [auto, setAuto] = useState(false);
  const [orden, setOrden] = useState<string[]>(guardado.orden || []),
    [columnas, setColumnas] = useState(guardado.columnas ?? true),
    [relaciones, setRelaciones] = useState(guardado.relaciones ?? true),
    [enfoque, setEnfoque] = useState(false),
    [busqueda, setBusqueda] = useState(""),
    [config, setConfig] = useState(false);
  const [detalle, setDetalle] = useState<{
      tabla: string;
      columna: Columna;
    } | null>(null),
    [mensaje, setMensaje] = useState("");
  const [posiciones, setPosiciones] = useState<
    Record<string, { x: number; y: number }>
  >({});
  const etapas = useMemo(() => generarEtapas(esquema, orden), [esquema, orden]);
  const etapa = etapas[Math.min(paso, etapas.length - 1)];
  const relacion = esquema.relaciones.find((r) => r.id === etapa.relacion);
  const tabla = esquema.tablas.find((t) => t.nombre === etapa.tabla);
  const flujo = useReactFlow();
  const lienzo = useRef<HTMLDivElement>(null);
  const avanzar = useCallback(
    (delta: number) => {
      setDetalle(null);
      setPaso((p) => Math.max(0, Math.min(etapas.length - 1, p + delta)));
    },
    [etapas.length],
  );
  useEffect(() => {
    localStorage.setItem(
      "electrogestion-config",
      JSON.stringify({ orden, columnas, relaciones }),
    );
  }, [orden, columnas, relaciones]);
  useEffect(() => {
    if (!auto || bienvenida) return;
    const t = setInterval(() => avanzar(1), 2800);
    return () => clearInterval(t);
  }, [auto, bienvenida, avanzar]);
  useEffect(() => {
    if (paso === etapas.length - 1) setAuto(false);
  }, [paso, etapas.length]);
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).matches("input,select,button,textarea"))
        return;
      if (["ArrowRight", "ArrowLeft", " "].includes(e.key)) {
        e.preventDefault();
        setBienvenida(false);
        if (e.key === " ") setAuto((a) => !a);
        else {
          setAuto(false);
          avanzar(e.key === "ArrowRight" ? 1 : -1);
        }
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [avanzar]);
  const seleccionar = useCallback(
    (t: string, c: Columna) => setDetalle({ tabla: t, columna: c }),
    [],
  );
  const { nodos, aristas } = useMemo(() => {
    const nombres = etapa.tablas.filter(
      (n: string) =>
        !enfoque ||
        (!etapa.tabla && !relacion) ||
        n === etapa.tabla ||
        n === relacion?.origen ||
        n === relacion?.destino,
    );
    const grafo = new dagre.graphlib.Graph();
    grafo.setGraph({
      rankdir: "LR",
      nodesep: 80,
      ranksep: 150,
      marginx: 50,
      marginy: 50,
    });
    grafo.setDefaultEdgeLabel(() => ({}));
    nombres.forEach((n: string) => {
      const t = esquema.tablas.find((t) => t.nombre === n)!;
      grafo.setNode(n, {
        width: 300,
        height: 58 + (columnas ? (etapa.columnas[n] || 0) * 30 : 0),
      });
    });
    const visibles = esquema.relaciones.filter(
      (r) =>
        etapa.relaciones.includes(r.id) &&
        nombres.includes(r.origen) &&
        nombres.includes(r.destino),
    );
    visibles.forEach((r) => grafo.setEdge(r.destino, r.origen));
    dagre.layout(grafo);
    const nodos: Nodo[] = nombres.map((n: string, i: number) => {
      const t = esquema.tablas.find((t) => t.nombre === n)!;
      const punto = grafo.node(n);
      return {
        id: n,
        type: "entidad",
        position: posiciones[n] || {
          x: punto.x - 150,
          y: punto.y - punto.height / 2,
        },
        style: { "--acento": paleta[i % paleta.length] } as React.CSSProperties,
        data: {
          tabla: t,
          cantidad: columnas ? etapa.columnas[n] || 0 : 0,
          activo:
            n === etapa.tabla ||
            n === relacion?.origen ||
            n === relacion?.destino,
          resaltados: relacion
            ? n === relacion.origen
              ? relacion.columnas
              : n === relacion.destino
                ? relacion.referencias
                : []
            : [],
          seleccionar,
        },
      };
    });
    const aristas: Edge[] =
      relaciones && columnas
        ? visibles.flatMap((r) =>
            r.columnas.map((c, i) => ({
              id: r.id + i,
              source: r.origen,
              target: r.destino,
              sourceHandle: c,
              targetHandle: r.referencias[i],
              animated: true,
              type: "smoothstep",
              label: `${r.cardinalidad} · ${r.opcional ? "opcional" : "obligatoria"}`,
              style: {
                stroke: r.id === relacion?.id ? "#b4ee87" : "#668078",
                strokeWidth: r.id === relacion?.id ? 2.5 : 1.3,
              },
              labelStyle: { fill: "#cfdfd5", fontSize: 11 },
              labelBgStyle: { fill: "#1c2827" },
              markerEnd: undefined,
            })),
          )
        : [];
    return { nodos, aristas };
  }, [
    etapa,
    esquema,
    enfoque,
    columnas,
    relaciones,
    relacion,
    seleccionar,
    posiciones,
  ]);
  useEffect(() => {
    const t = setTimeout(
      () => flujo.fitView({ padding: 0.22, duration: 500, maxZoom: 1.15 }),
      100,
    );
    return () => clearTimeout(t);
  }, [paso, columnas, enfoque, bienvenida, flujo]);
  const irTabla = (n: string) => {
    setBienvenida(false);
    setAuto(false);
    setPaso(etapas.findIndex((e) => e.tipo === "tabla" && e.tabla === n));
    setDetalle(null);
  };
  const pantalla = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setMensaje("El navegador no permite pantalla completa.");
    }
  };
  const exportar = async (tipo: "png" | "svg") => {
    try {
      if (!lienzo.current) return;
      setMensaje("Preparando exportación…");
      const url = await (tipo === "png" ? toPng : toSvg)(lienzo.current, {
        backgroundColor: "#131a20",
        filter: (n) =>
          !(
            n instanceof Element &&
            n.matches(
              ".react-flow__controls,.react-flow__minimap,.react-flow__attribution",
            )
          ),
      });
      const a = document.createElement("a");
      a.download = `electrogestion-etapa-${paso}.${tipo}`;
      a.href = url;
      a.click();
      setMensaje("Diagrama exportado.");
    } catch {
      setMensaje("No se pudo exportar. Prueba con SVG.");
    }
  };
  function mover(n: string, delta: number) {
    const lista = etapas
      .filter((e) => e.tipo === "tabla")
      .map((e) => e.tabla as string);
    const i = lista.indexOf(n);
    if (i + delta < 0 || i + delta >= lista.length) return;
    [lista[i], lista[i + delta]] = [lista[i + delta], lista[i]];
    setOrden(lista);
    setPaso(0);
    setAuto(false);
  }
  return (
    <div className="aplicacion">
      <header className="barra-superior">
        <a
          className="marca"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setBienvenida(true);
            setAuto(false);
          }}
        >
          <span className="logotipo">
            <GitBranch size={23} />
          </span>
          <span>
            electro<span className="marca-ligera">gestión</span>
            <small>LABORATORIO DE DATOS</small>
          </span>
        </a>
        <div className="ruta">
          Aula interactiva <span>/</span> Modelo entidad–relación
        </div>
        <span className="estado">
          <i /> Esquema real · modo estático
        </span>
        <button
          className="icono"
          title="Pantalla completa"
          aria-label="Pantalla completa"
          onClick={pantalla}
        >
          <Maximize size={18} />
        </button>
      </header>
      <div className="espacio-trabajo">
        <aside className="indice">
          <div className="indice-titulo">
            <span>EXPLORAR EL MODELO</span>
            <span>23</span>
          </div>
          <label className="buscador">
            <Search size={16} />
            <input
              aria-label="Buscar entidad"
              placeholder="Buscar una entidad…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <kbd>⌕</kbd>
          </label>
          <button
            className={`vista-general ${etapa.tipo === "completo" ? "seleccionada" : ""}`}
            onClick={() => {
              setBienvenida(false);
              setPaso(etapas.length - 1);
              setAuto(false);
            }}
          >
            <Layers size={17} /> Diagrama completo <ArrowRight size={15} />
          </button>
          <div className="grupo-titulo">
            ENTIDADES <span>{esquema.tablas.length}</span>
            <button
              className="icono"
              title="Reordenar presentación"
              aria-label="Reordenar presentación"
              onClick={() => setConfig(!config)}
            >
              <SlidersHorizontal size={14} />
            </button>
          </div>
          <nav className="lista-tablas">
            {etapas
              .filter((e) => e.tipo === "tabla")
              .map((e) => e.tabla as string)
              .filter((n) => n.includes(busqueda.toLowerCase()))
              .map((n, i) => (
                <div
                  className={`item-tabla ${etapa.tabla === n ? "actual" : ""}`}
                  key={n}
                >
                  <button onClick={() => irTabla(n)}>
                    <span className="numero">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span>{n}</span>
                    {etapa.tablas.includes(n) && <Check size={12} />}
                  </button>
                  {config && (
                    <span className="reordenar">
                      <button
                        aria-label={`Subir ${n}`}
                        onClick={() => mover(n, -1)}
                      >
                        <ChevronUp size={12} />
                      </button>
                      <button
                        aria-label={`Bajar ${n}`}
                        onClick={() => mover(n, 1)}
                      >
                        <ChevronDown size={12} />
                      </button>
                    </span>
                  )}
                </div>
              ))}
          </nav>
          <div className="indice-pie">
            <Database size={17} />
            <div>
              <strong>electrogestion_db</strong>
              <small>
                {esquema.tablas.length} entidades · {esquema.relaciones.length}{" "}
                relaciones
              </small>
            </div>
          </div>
        </aside>
        <main>
          <div className="encabezado-lienzo">
            <div>
              <span className="ceja">EL MODELO, PASO A PASO</span>
              <h1>
                {bienvenida ? "La estructura detrás del sistema" : etapa.titulo}
              </h1>
            </div>
            <button
              className="boton-secundario"
              onClick={() => setConfig(!config)}
            >
              <Download size={15} /> Exportar
            </button>
          </div>
          {config && (
            <div className="opciones-exportar">
              <span>Exportar vista actual</span>
              <button onClick={() => exportar("png")}>PNG</button>
              <button onClick={() => exportar("svg")}>SVG</button>
              <button onClick={() => window.print()}>PDF / Imprimir</button>
              <button
                onClick={() => setConfig(false)}
                aria-label="Cerrar exportación"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="lienzo-contenedor">
            <div className="lienzo" ref={lienzo}>
              <ReactFlow
                nodes={bienvenida ? [] : nodos}
                edges={bienvenida ? [] : aristas}
                nodeTypes={nodeTypes}
                onNodeDragStop={(_e, n) =>
                  setPosiciones((p) => ({ ...p, [n.id]: n.position }))
                }
                fitView
                minZoom={0.08}
                maxZoom={2}
                nodesDraggable
              >
                <Background color="#334139" gap={22} size={1} />
                <Controls showInteractive={false} />
                <MiniMap
                  nodeColor="#50785b"
                  maskColor="#10171bc9"
                  pannable
                  zoomable
                />
              </ReactFlow>
            </div>
            <div className="etiqueta-lienzo">
              <span className="punto-verde" />{" "}
              {bienvenida
                ? "ESPACIO DE APRENDIZAJE"
                : etapa.tipo === "completo"
                  ? "MODELO COMPLETO"
                  : `ETAPA ${String(paso + 1).padStart(2, "0")}`}
              <span className="separador">|</span>
              {bienvenida
                ? "Tu recorrido empieza aquí"
                : `${etapa.tablas.length} / ${esquema.tablas.length} entidades`}
            </div>
            <div className="herramientas">
              <button
                className={columnas ? "encendida" : ""}
                title="Mostrar u ocultar columnas"
                aria-label="Mostrar u ocultar columnas"
                onClick={() => setColumnas(!columnas)}
              >
                {columnas ? <Eye size={16} /> : <EyeOff size={16} />}
              </button>
              <button
                className={relaciones ? "encendida" : ""}
                title="Mostrar u ocultar relaciones"
                aria-label="Mostrar u ocultar relaciones"
                onClick={() => setRelaciones(!relaciones)}
              >
                <GitBranch size={16} />
              </button>
              <button
                className={enfoque ? "encendida" : ""}
                title="Modo enfoque"
                aria-label="Modo enfoque"
                onClick={() => setEnfoque(!enfoque)}
              >
                <Focus size={16} />
              </button>
            </div>
            <AnimatePresence>
              {bienvenida && (
                <motion.div
                  className="bienvenida"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="simbolo-modelo">
                    <Database size={31} />
                    <span className="orbita uno">
                      <KeyRound size={17} />
                    </span>
                    <span className="orbita dos">
                      <Link2 size={17} />
                    </span>
                  </div>
                  <span className="etiqueta-curso">
                    UNA BASE DE DATOS. UNA HISTORIA CONECTADA.
                  </span>
                  <h2>
                    Entiende las entidades.
                    <br />
                    <em>Descubre las conexiones.</em>
                  </h2>
                  <p>
                    Construye el modelo de ElectroGestión, una tabla a la vez.
                    De la primera clave al sistema completo.
                  </p>
                  <button
                    className="boton-principal"
                    onClick={() => {
                      setBienvenida(false);
                      setPaso(0);
                    }}
                  >
                    Iniciar presentación <ArrowRight size={17} />
                  </button>
                  <div className="datos-curso">
                    <span>
                      <Database size={14} /> {esquema.tablas.length} entidades
                      reales
                    </span>
                    <span>
                      <GitBranch size={14} /> {esquema.relaciones.length}{" "}
                      relaciones verificadas
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {!bienvenida && paso === 0 && (
              <div className="inicio-vacio">
                <Database size={38} />
                <h2>electrogestion_db</h2>
                <p>Un lienzo vacío. El comienzo de un sistema conectado.</p>
                <button className="boton-principal" onClick={() => avanzar(1)}>
                  Descubrir primera entidad <ArrowRight size={16} />
                </button>
              </div>
            )}
            <div className="leyenda">
              <span>
                <i className="amarillo" /> Clave primaria
              </span>
              <span>
                <i className="verde" /> Clave foránea
              </span>
              <span>
                <i className="gris" /> Atributo
              </span>
            </div>
          </div>
          <footer className="controles">
            <div className="progreso-linea">
              <div
                style={{ width: `${(paso / (etapas.length - 1)) * 100}%` }}
              />
            </div>
            <div className="paso-texto">
              <span>RECORRIDO GUIADO</span>
              <strong>
                {String(paso + 1).padStart(2, "0")}{" "}
                <small>/ {etapas.length}</small>
              </strong>
            </div>
            <div className="botones-reproduccion">
              <button
                className="icono"
                aria-label="Reiniciar"
                title="Reiniciar"
                onClick={() => {
                  setPaso(0);
                  setAuto(false);
                  setDetalle(null);
                }}
              >
                <RotateCcw size={17} />
              </button>
              <button
                className="icono"
                aria-label="Etapa anterior"
                disabled={paso === 0 || bienvenida}
                onClick={() => {
                  setAuto(false);
                  avanzar(-1);
                }}
              >
                <ArrowLeft size={20} />
              </button>
              <button
                className="reproducir"
                aria-label={auto ? "Pausar" : "Reproducir automáticamente"}
                disabled={bienvenida || paso === etapas.length - 1}
                onClick={() => setAuto(!auto)}
              >
                {auto ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                className="siguiente"
                disabled={bienvenida || paso === etapas.length - 1}
                onClick={() => {
                  setAuto(false);
                  avanzar(1);
                }}
              >
                Siguiente <ArrowRight size={17} />
              </button>
            </div>
            <span className="atajos">
              <kbd>←</kbd>
              <kbd>→</kbd> navegar <kbd>espacio</kbd> reproducir
            </span>
          </footer>
        </main>
        <aside className="explicacion">
          <div className="panel-etiqueta">
            <BookOpen size={16} /> GUÍA DE APRENDIZAJE
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={detalle ? detalle.tabla + detalle.columna.nombre : paso}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="contenido-explicacion"
            >
              {detalle ? (
                <>
                  <button
                    className="cerrar-detalle"
                    onClick={() => setDetalle(null)}
                  >
                    <X size={13} /> Cerrar detalle
                  </button>
                  <span className="ceja">EXPLORAR COLUMNA</span>
                  <h2>{detalle.columna.nombre}</h2>
                  <p>
                    Un atributo de <strong>{detalle.tabla}</strong>.
                  </p>
                  <dl>
                    <dt>Tipo de dato</dt>
                    <dd>{detalle.columna.tipo}</dd>
                    <dt>Permite NULL</dt>
                    <dd>{detalle.columna.nulo ? "Sí" : "No"}</dd>
                    <dt>Claves</dt>
                    <dd>
                      {[
                        detalle.columna.pk ? "Primaria" : "",
                        detalle.columna.fk ? "Foránea" : "",
                      ]
                        .filter(Boolean)
                        .join(" y ") || "Atributo sin clave"}
                    </dd>
                    <dt>Propiedades</dt>
                    <dd>
                      {detalle.columna.extra || "Sin propiedades adicionales"}
                    </dd>
                  </dl>
                </>
              ) : relacion ? (
                <>
                  <span className="etiqueta-relacion">
                    FK DECLARADA · {relacion.cardinalidad}
                  </span>
                  <h2>
                    Las claves que
                    <br />
                    conectan el sistema.
                  </h2>
                  <p>{relacion.descripcion}</p>
                  <div className="conexion-explicada">
                    <small>ORIGEN · CLAVE FORÁNEA</small>
                    <strong>{relacion.origen}</strong>
                    <code>{relacion.columnas.join(" + ")}</code>
                    <ArrowDownVisual />
                    <small>DESTINO · CLAVE REFERENCIADA</small>
                    <strong>{relacion.destino}</strong>
                    <code>{relacion.referencias.join(" + ")}</code>
                  </div>
                  <div className="nota">
                    <span>EJEMPLO ILUSTRATIVO</span>
                    <p>{relacion.ejemplo}</p>
                  </div>
                  <dl>
                    <dt>Nulabilidad de la FK</dt>
                    <dd>{relacion.opcional ? "Opcional" : "Obligatoria"}</dd>
                    <dt>ON DELETE / ON UPDATE</dt>
                    <dd>
                      {relacion.reglas.eliminar} / {relacion.reglas.actualizar}
                    </dd>
                    <dt>Clave primaria del destino</dt>
                    <dd>
                      {esquema.tablas
                        .find((t) => t.nombre === relacion.destino)
                        ?.indices.find((i) => i.nombre === "PRIMARY")
                        ?.columnas.join(", ") || "Sin PK"}
                    </dd>
                  </dl>
                  {esquema.asociaciones?.find(
                    (a) => a.tabla === relacion.origen,
                  ) ? (
                    <div className="nota">
                      <span>TABLA INTERMEDIA · N:M</span>
                      <p>
                        {
                          esquema.asociaciones.find(
                            (a) => a.tabla === relacion.origen,
                          )?.descripcion
                        }
                      </p>
                      <p>
                        {
                          esquema.asociaciones.find(
                            (a) => a.tabla === relacion.origen,
                          )?.fundamento
                        }
                      </p>
                    </div>
                  ) : (
                    esquema.relaciones.filter(
                      (r) => r.origen === relacion.origen,
                    ).length >= 2 && (
                      <p className="nota-tecnica">
                        Esta entidad enlaza varias tablas mediante FK. Eso no
                        basta para afirmar una relación N:M: revisa también su
                        propósito y restricciones únicas.
                      </p>
                    )
                  )}
                </>
              ) : (
                <>
                  <span className="capitulo">
                    {bienvenida
                      ? "ANTES DE COMENZAR"
                      : etapa.tipo === "completo"
                        ? "EL SISTEMA CONECTADO"
                        : `CONCEPTO ${String(paso + 1).padStart(2, "0")}`}
                  </span>
                  <h2>
                    {bienvenida
                      ? "Cada conexión tiene una razón."
                      : etapa.tipo === "inicio"
                        ? "Primero, el contexto."
                        : etapa.tipo === "completo"
                          ? "Ahora puedes ver el conjunto."
                          : tabla
                            ? `Dentro de ${tabla.nombre}.`
                            : "El modelo toma forma."}
                  </h2>
                  <p>
                    {bienvenida
                      ? "Una base de datos es más que un conjunto de tablas. Es la forma en que un sistema organiza su información y mantiene su coherencia."
                      : etapa.tipo === "inicio"
                        ? "Avanza para descubrir las entidades principales. Después desplegaremos sus atributos y conectaremos las claves declaradas."
                        : etapa.tipo === "completo"
                          ? "Has recorrido todas las entidades y relaciones declaradas. Explora las columnas, mueve las tablas y exporta la vista del diagrama."
                          : `Esta entidad tiene ${tabla?.columnas.length} atributos y ${tabla?.indices.length} índices. Los atributos se revelan uno a uno para comprender su estructura.`}
                  </p>
                  {etapa.tipo === "columna" && tabla && (
                    <div className="nota">
                      <span>ATRIBUTO ACTUAL</span>
                      <strong>{etapa.columna}</strong>
                      <p>
                        {
                          tabla.columnas.find((c) => c.nombre === etapa.columna)
                            ?.tipo
                        }
                      </p>
                      <p>
                        {tabla.columnas.find((c) => c.nombre === etapa.columna)
                          ?.pk
                          ? "La clave primaria identifica cada registro de forma única."
                          : tabla.columnas.find(
                                (c) => c.nombre === etapa.columna,
                              )?.fk
                            ? "Esta clave foránea participa en una restricción referencial declarada."
                            : "Este atributo describe una propiedad de la entidad."}
                      </p>
                    </div>
                  )}
                  <div className="conceptos">
                    <div>
                      <span className="concepto-icono amarillo">
                        <KeyRound size={18} />
                      </span>
                      <div>
                        <strong>Identificar</strong>
                        <p>Una clave primaria distingue cada registro.</p>
                      </div>
                    </div>
                    <div>
                      <span className="concepto-icono verde">
                        <Link2 size={18} />
                      </span>
                      <div>
                        <strong>Relacionar</strong>
                        <p>
                          Una clave foránea referencia otra clave del modelo.
                        </p>
                      </div>
                    </div>
                    <div>
                      <span className="concepto-icono azul">
                        <GitBranch size={18} />
                      </span>
                      <div>
                        <strong>Comprender</strong>
                        <p>
                          La cardinalidad se apoya en restricciones e índices.
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
          <div className="fuente">
            <span className="punto-verde" /> BASADO EN METADATOS REALES
            <p>Solo estructura. Sin registros de negocio.</p>
            <small>
              Captura:{" "}
              {new Date(esquema.generado).toLocaleDateString("es-GT", {
                timeZone: "America/Guatemala",
              })}
            </small>
          </div>
        </aside>
      </div>
      {mensaje && (
        <button className="aviso" onClick={() => setMensaje("")}>
          {mensaje} <X size={14} />
        </button>
      )}
    </div>
  );
}
function ArrowDownVisual() {
  return <div className="flecha-vertical">↓</div>;
}
function App() {
  const [esquema, setEsquema] = useState<Esquema | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}esquema_erd.json`)
      .then((r) => {
        if (!r.ok)
          throw Error(
            "No se encontró esquema_erd.json. Ejecuta npm run actualizar-esquema.",
          );
        return r.json();
      })
      .then((e) => {
        validarEsquema(e);
        setEsquema(e);
      })
      .catch((e) => setError(e.message));
  }, []);
  return esquema ? (
    <ReactFlowProvider>
      <Aula esquema={esquema} />
    </ReactFlowProvider>
  ) : (
    <div className="cargando">
      <Database size={36} />
      <h1>{error ? "No se pudo cargar el modelo" : "Preparando el aula…"}</h1>
      <p>{error || "Leyendo metadatos del esquema"}</p>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
