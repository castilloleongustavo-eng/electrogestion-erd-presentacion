import type { Esquema } from "../../modelos/esquema";
import type { Sesion } from "../../servicios/sincronizacion/useSesion";
import { Diagrama } from "../../componentes/diagrama/Diagrama";
import { Explicacion } from "../../componentes/diagrama/Explicacion";
import identidad from "../../datos/modelo.json";
export function Presentacion({
  esquema,
  sesion,
}: {
  esquema: Esquema;
  sesion: Sesion;
}) {
  const { estado, paso, conectado, cargado, error } = sesion;
  return (
    <main
      className={`pantalla-publica ${estado?.explicaciones && estado.pantalla !== "inicio" ? "con-explicacion" : ""}`}
    >
      {estado && <Diagrama esquema={esquema} estado={estado} paso={paso} />}
      {!estado || estado.pantalla === "inicio" ? (
        <div className="titulo-publico">
          <span>MODELO ENTIDAD–RELACIÓN</span>
          <h1>
            electro<span>gestión</span>
          </h1>
          <p>
            {error
              ? "Esperando una conexión válida con la sesión."
              : !cargado
                ? "Conectando con la presentación…"
                : !estado
                  ? "Esperando al presentador."
                  : "La estructura de un sistema conectado."}
          </p>
          <small>
            {esquema.tablas.length} entidades · {esquema.relaciones.length}{" "}
            relaciones declaradas
          </small>
        </div>
      ) : null}
      {estado?.explicaciones && estado.pantalla !== "inicio" && (
        <Explicacion esquema={esquema} estado={estado} paso={paso} />
      )}
      {estado?.indicador && (
        <span className="etapa-publica">
          {String(paso + 1).padStart(2, "0")} <i>/ {identidad.totalEtapas}</i>
        </span>
      )}
      {estado && !conectado && (
        <span className="conexion-publica">
          Reconectando · última revisión confirmada
        </span>
      )}
      {estado && error && (
        <span className="conexion-publica">
          {error.includes("versión del modelo")
            ? "La versión del modelo cambió. Recarga esta pantalla."
            : "No se pudo actualizar la sesión. Se conserva la última revisión confirmada."}
        </span>
      )}
    </main>
  );
}
