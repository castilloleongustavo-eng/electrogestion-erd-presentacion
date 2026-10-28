import { toPng, toSvg } from "html-to-image";
import { useCallback, useEffect, useMemo, useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import {
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Layers,
  Focus,
  Database,
  LogOut,
  Radio,
  ShieldCheck,
  Search,
  ExternalLink,
  KeyRound,
  Link2,
  Eye,
  Clapperboard,
  BookOpen,
} from "lucide-react";
import type { Esquema, Columna } from "../../modelos/esquema";
import type { Cambio } from "../../modelos/estado";
import type { Servicios } from "../../servicios/sincronizacion/firebase";
import type { Sesion } from "../../servicios/sincronizacion/useSesion";
import { usePresentador } from "../../servicios/autenticacion/usePresentador";
import { generarEtapas } from "../../modelos/presentacion.mjs";
import { Diagrama } from "../../componentes/diagrama/Diagrama";
import { ContextoEtapa } from "../../componentes/controles/ContextoEtapa";
import { useCamaraCompartida } from "../../servicios/sincronizacion/useCamaraCompartida";
import { Notas } from "../../componentes/controles/Notas";
export function Control({
  esquema,
  servicios,
  sesion,
}: {
  esquema: Esquema;
  servicios: Servicios;
  sesion: Sesion;
}) {
  const auth = usePresentador(servicios);
  const [mensaje, setMensaje] = useState(""),
    [busqueda, setBusqueda] = useState(""),
    [detalle, setDetalle] = useState<{
      tabla: string;
      columna: Columna;
    } | null>(null),
    [email, setEmail] = useState(""),
    [clave, setClave] = useState("");
  const etapas = useMemo(() => generarEtapas(esquema), [esquema]),
    { estado, paso, conectado, enviando } = sesion;
  const camaraCompartida = useCamaraCompartida(sesion);
  const ocupado = !conectado || enviando || camaraCompartida.pendiente;
  const seleccionarColumna = useCallback(
    (tabla: string, columna: Columna) => setDetalle({ tabla, columna }),
    [],
  );
  async function enviar(cambio: Cambio | null) {
    setMensaje("");
    try {
      await sesion.ejecutar(cambio);
    } catch (e) {
      setMensaje(e instanceof Error ? e.message : "No se confirmó el cambio.");
    }
  }
  useEffect(() => {
    if (!auth.autorizado) return;
    const tecla = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).closest("input,textarea,select,button") ||
        ocupado ||
        !estado
      )
        return;
      if (["ArrowRight", "ArrowLeft", " "].includes(e.key)) {
        e.preventDefault();
        void enviar({
          tipo:
            e.key === " "
              ? estado.reproduccion.activa
                ? "pausar"
                : "reproducir"
              : e.key === "ArrowRight"
                ? "siguiente"
                : "anterior",
        });
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [auth.autorizado, ocupado, estado, sesion.ejecutar]);
  async function exportar(tipo: "png" | "svg") {
    try {
      const el = document.querySelector<HTMLElement>(
        ".previa-lienzo .diagrama-vivo",
      );
      if (!el) return;
      const url = await (tipo === "png" ? toPng : toSvg)(el, {
        backgroundColor: "#10171c",
      });
      const enlace = document.createElement("a");
      enlace.download = `electrogestion-etapa-${paso + 1}.${tipo}`;
      enlace.href = url;
      enlace.click();
    } catch {
      setMensaje("No se pudo exportar la vista del diagrama.");
    }
  }
  if (auth.cargando)
    return (
      <div className="acceso-control">
        <ShieldCheck size={34} />
        <h1>Verificando acceso…</h1>
      </div>
    );
  if (!auth.autorizado)
    return (
      <div className="acceso-control">
        <div className="acceso-tarjeta">
          <span className="marca-acceso">
            <Radio size={22} /> ELECTROGESTIÓN EN VIVO
          </span>
          <ShieldCheck size={42} />
          <span className="ceja">ESPACIO DEL PRESENTADOR</span>
          <h1>
            Tu presentación.
            <br />
            <em>En todas las pantallas.</em>
          </h1>
          <p>
            Inicia sesión con la cuenta autorizada para controlar la única
            sesión global.
          </p>
          {!auth.usuario ? (
            <button
              className="boton-principal"
              onClick={() => void auth.entrar()}
            >
              Continuar con Google <ArrowRight size={17} />
            </button>
          ) : (
            <>
              <p>La cuenta actual no tiene acceso al control.</p>
              <p className="uid-control">
                UID de esta cuenta: <code>{auth.usuario.uid}</code>
              </p>
              <button
                className="boton-secundario"
                onClick={() => void auth.salir()}
              >
                Cambiar de cuenta
              </button>
            </>
          )}
          {auth.error && (
            <p className="error-control" role="alert">
              {auth.error}
            </p>
          )}
          {servicios.pruebas && (
            <form
              className="acceso-pruebas"
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  await signInWithEmailAndPassword(
                    servicios.auth,
                    email,
                    clave,
                  );
                } catch {
                  setMensaje("No se pudo acceder al emulador.");
                }
              }}
            >
              <span>Solo emulador local</span>
              <input
                type="email"
                aria-label="Correo de prueba"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                type="password"
                aria-label="Contraseña de prueba"
                value={clave}
                onChange={(e) => setClave(e.target.value)}
              />
              <button type="submit">Entrar al emulador</button>
              <p>{mensaje}</p>
            </form>
          )}
        </div>
      </div>
    );
  if (!estado)
    return (
      <div className="acceso-control">
        <div className="acceso-tarjeta">
          <ShieldCheck size={40} />
          <h1>Sesión electrogestion</h1>
          <p>
            Tu cuenta está autorizada. Inicializa la sesión global para
            comenzar.
          </p>
          <button
            className="boton-principal"
            disabled={ocupado}
            onClick={() => void enviar(null)}
          >
            Inicializar sesión global
          </button>
          {(sesion.error || mensaje) && (
            <p role="alert">{mensaje || sesion.error}</p>
          )}
        </div>
      </div>
    );
  const etapa = etapas[paso];
  const mostrarRelaciones = esquema.relaciones;
  const tablaSeleccionada = esquema.tablas.find(
    (t) => t.nombre === (estado.tabla || etapa.tabla),
  );
  return (
    <div className="control-vivo">
      <header className="cabecera-control">
        <a href="#/control" className="marca-control">
          <Radio size={22} />
          <strong>
            electro<span>gestión</span>
          </strong>
          <small>EN VIVO</small>
        </a>
        <span
          className={`conexion-control ${conectado ? "online" : ""}`}
          role="status"
        >
          <i />
          {conectado ? "Conectado" : "Reconectando"} · r{estado.revision}
        </span>
        <div className="acciones-cabecera">
          <a
            className="enlace-publico"
            href="#/presentacion"
            target="_blank"
            rel="noreferrer"
          >
            <ExternalLink size={15} /> Pantalla pública
          </a>
          <button
            title="Cerrar sesión"
            aria-label="Cerrar sesión"
            onClick={() => void auth.salir()}
          >
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="titulo-control">
        <div>
          <span className="ceja">SESIÓN GLOBAL · ELECTROGESTION</span>
          <h1>El escenario está en tus manos.</h1>
          <p>Cada cambio confirmado llega a todas las pantallas conectadas.</p>
        </div>
        <span className="sello-privado">
          <ShieldCheck size={16} /> Control privado
        </span>
      </div>
      {(mensaje || sesion.error) && (
        <div className="error-control banner-error" role="alert">
          {mensaje || sesion.error}
        </div>
      )}
      {!conectado && (
        <div className="banner-desconexion" role="status">
          Sin conexión. Los controles están bloqueados hasta recuperar el estado
          del servidor.
        </div>
      )}
      <div className="rejilla-control">
        <div className="columna-principal">
          <section className="tarjeta-control vista-previa">
            <header>
              <Radio size={16} />
              <h2>Vista previa de la emisión</h2>
              <span>Revisión {estado.revision}</span>
            </header>
            <div className="previa-lienzo">
              <Diagrama
                esquema={esquema}
                estado={estado}
                paso={paso}
                previa
                seleccionar={seleccionarColumna}
                cambiarCamara={camaraCompartida.cambiar}
                interaccionCamara={camaraCompartida.interaccion}
                camaraPendiente={camaraCompartida.pendiente}
                bloqueado={!conectado}
                centrarBloqueado={ocupado}
                centrar={() => void enviar({ tipo: "ajustar" })}
                navegacion={{
                  anterior: () => void enviar({ tipo: "anterior" }),
                  siguiente: () => void enviar({ tipo: "siguiente" }),
                  anteriorBloqueado: ocupado || paso === 0,
                  siguienteBloqueado: ocupado || paso === etapas.length - 1,
                }}
              />
              {estado.pantalla === "inicio" && (
                <div className="previa-inicio">
                  <Database size={30} />
                  <h3>electrogestión</h3>
                  <p>La presentación está en su pantalla inicial.</p>
                </div>
              )}
            </div>
            <div className="pie-previa">
              <span>
                Etapa <b>{paso + 1}</b> de {etapas.length}
              </span>
              <span>
                {etapa.tablas.length} / {esquema.tablas.length} entidades
              </span>
            </div>
            <div className="progreso-control">
              <div
                style={{ width: `${(paso / (etapas.length - 1)) * 100}%` }}
              />
            </div>
          </section>
          <ContextoEtapa
            esquema={esquema}
            estado={estado}
            paso={paso}
            detalle={detalle}
          />
          <section className="tarjeta-control navegacion-control">
            <header>
              <ArrowRight size={17} />
              <h2>Navegación</h2>
              <span>
                {estado.reproduccion.activa && paso < etapas.length - 1
                  ? "Reproduciendo"
                  : "En pausa"}
              </span>
            </header>
            <div className="acciones-reproduccion">
              <button
                disabled={ocupado}
                onClick={() =>
                  void enviar({
                    tipo: estado.reproduccion.activa ? "pausar" : "reproducir",
                  })
                }
              >
                {estado.reproduccion.activa ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} />
                )}{" "}
                {estado.reproduccion.activa
                  ? "Pausar reproducción"
                  : "Reproducción automática"}
              </button>
              <button
                disabled={ocupado}
                onClick={() => void enviar({ tipo: "reiniciar" })}
              >
                <RotateCcw size={17} /> Reiniciar
              </button>
              <button
                disabled={ocupado}
                onClick={() => void enviar({ tipo: "completo" })}
              >
                <Layers size={17} /> Diagrama completo
              </button>
            </div>
            <label className="selector-etapa">
              Ir a una etapa
              <select
                aria-label="Ir a una etapa"
                value={paso}
                disabled={ocupado}
                onChange={(e) =>
                  void enviar({ tipo: "ir", paso: Number(e.target.value) })
                }
              >
                {etapas.map((e, i) => (
                  <option value={i} key={i}>
                    {i + 1}. {e.titulo}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="tarjeta-control">
            <header>
              <Layers size={17} />
              <h2>Exportar vista del diagrama</h2>
            </header>
            <div className="herramientas-control">
              <button onClick={() => void exportar("png")}>
                Descargar PNG
              </button>
              <button onClick={() => void exportar("svg")}>
                Descargar SVG
              </button>
              <button
                onClick={() => {
                  void document.documentElement
                    .requestFullscreen()
                    .catch(() =>
                      setMensaje("El navegador no permite pantalla completa."),
                    );
                }}
              >
                Pantalla completa del control
              </button>
            </div>
          </section>
          <Notas servicios={servicios} paso={paso} conectado={conectado} />
        </div>
        <div className="columna-secundaria">
          <section className="tarjeta-control">
            <header>
              <Eye size={17} />
              <h2>Lo que ve el público</h2>
            </header>
            <div className="opciones-control">
              {[
                {
                  campo: "columnas",
                  titulo: "Columnas",
                  texto: "Mostrar atributos y tipos",
                  icono: <Database size={17} />,
                },
                {
                  campo: "relaciones",
                  titulo: "Relaciones",
                  texto: "Mostrar conectores declarados",
                  icono: <Link2 size={17} />,
                },
                {
                  campo: "claves",
                  titulo: "Claves PK y FK",
                  texto: "Resaltar primarias y foráneas",
                  icono: <KeyRound size={17} />,
                },
                {
                  campo: "enfoque",
                  titulo: "Modo enfoque",
                  texto: "Centrar la etapa activa",
                  icono: <Focus size={17} />,
                },
                {
                  campo: "animaciones",
                  titulo: "Animaciones",
                  texto: "Entradas y conectores animados",
                  icono: <Clapperboard size={17} />,
                },
                {
                  campo: "explicaciones",
                  titulo: "Explicaciones públicas",
                  texto: "Contexto técnico del modelo",
                  icono: <BookOpen size={17} />,
                },
                {
                  campo: "indicador",
                  titulo: "Indicador de etapa",
                  texto: "Progreso discreto en pantalla",
                  icono: <Layers size={17} />,
                },
              ].map((o) => (
                <label className="opcion-control" key={o.campo}>
                  {o.icono}
                  <span>
                    <strong>{o.titulo}</strong>
                    <small>{o.texto}</small>
                  </span>
                  <input
                    aria-label={o.titulo}
                    type="checkbox"
                    checked={Boolean(estado[o.campo as keyof typeof estado])}
                    disabled={ocupado}
                    onChange={(e) =>
                      void enviar({
                        tipo: "opcion",
                        campo: o.campo,
                        valor: e.target.checked,
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>
          <section className="tarjeta-control">
            <header>
              <Database size={17} />
              <h2>Enfocar entidad</h2>
              <span>{esquema.tablas.length}</span>
            </header>
            <label className="buscador-control">
              <Search size={16} />
              <input
                aria-label="Buscar entidad"
                placeholder="Buscar en el modelo…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </label>
            <div className="entidades-control">
              {esquema.tablas
                .filter((t) => t.nombre.includes(busqueda.toLowerCase()))
                .map((t) => (
                  <button
                    key={t.nombre}
                    disabled={ocupado}
                    className={estado.tabla === t.nombre ? "activa" : ""}
                    onClick={() =>
                      void enviar({
                        tipo: "tabla",
                        tabla: t.nombre,
                        paso:
                          etapas.findIndex(
                            (e) => e.tipo === "tabla" && e.tabla === t.nombre,
                          ) + t.columnas.length,
                      })
                    }
                  >
                    <Database size={14} />
                    <span>{t.nombre}</span>
                    <ArrowRight size={13} />
                  </button>
                ))}
            </div>
          </section>
          <section className="tarjeta-control">
            <header>
              <Link2 size={17} />
              <h2>Resaltar relación</h2>
            </header>
            <label className="selector-etapa">
              Relación declarada
              <select
                aria-label="Resaltar relación"
                value={estado.relacion || ""}
                disabled={ocupado}
                onChange={(e) => {
                  const id = e.target.value;
                  if (id)
                    void enviar({
                      tipo: "relacion",
                      relacion: id,
                      paso: etapas.findIndex(
                        (x) => x.tipo === "relacion" && x.relacion === id,
                      ),
                    });
                }}
              >
                <option value="">Seleccionar una conexión…</option>
                {mostrarRelaciones.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.destino} → {r.origen} · {r.nombre}
                  </option>
                ))}
              </select>
            </label>
          </section>
          <section className="tarjeta-control">
            <header>
              <KeyRound size={17} />
              <h2>Resaltar campo</h2>
            </header>
            <label className="selector-etapa">
              {tablaSeleccionada?.nombre || "Selecciona primero una entidad"}
              <select
                aria-label="Resaltar campo"
                disabled={ocupado || !tablaSeleccionada}
                value={estado.campo}
                onChange={(e) => {
                  if (tablaSeleccionada && e.target.value)
                    void enviar({
                      tipo: "columna",
                      tabla: tablaSeleccionada.nombre,
                      campo: e.target.value,
                      paso:
                        etapas.findIndex(
                          (x) =>
                            x.tipo === "tabla" &&
                            x.tabla === tablaSeleccionada.nombre,
                        ) +
                        tablaSeleccionada.columnas.findIndex(
                          (c) => c.nombre === e.target.value,
                        ) +
                        1,
                    });
                }}
              >
                <option value="">Seleccionar columna…</option>
                {tablaSeleccionada?.columnas.map((c) => (
                  <option key={c.nombre} value={c.nombre}>
                    {c.nombre} · {c.tipo}
                    {c.pk ? " · PK" : c.fk ? " · FK" : ""}
                  </option>
                ))}
              </select>
            </label>
          </section>
        </div>
      </div>
      <footer className="pie-control">
        <ShieldCheck size={14} /> Sesión única · cambios confirmados por
        Firebase · notas privadas
      </footer>
    </div>
  );
}
