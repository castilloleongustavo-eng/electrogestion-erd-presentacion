import { useMemo } from "react";
import { BookOpen, Target, Layers } from "lucide-react";
import type { Esquema, Columna } from "../../modelos/esquema";
import type { EstadoPublico } from "../../modelos/estado";
import { describirEtapa } from "../../modelos/contexto.mjs";
import { generarEtapas } from "../../modelos/presentacion.mjs";
import { Explicacion } from "../diagrama/Explicacion";
export function ContextoEtapa({
  esquema,
  estado,
  paso,
  detalle,
}: {
  esquema: Esquema;
  estado: EstadoPublico;
  paso: number;
  detalle: { tabla: string; columna: Columna } | null;
}) {
  const etapas = useMemo(() => generarEtapas(esquema), [esquema]);
  const etapa = etapas[paso],
    contexto = describirEtapa(esquema, etapa);
  return (
    <section
      className="tarjeta-control contexto-etapa"
      aria-label="Contexto privado de la etapa"
    >
      <header>
        <BookOpen size={17} />
        <h2>Contexto de la etapa</h2>
        <span>Solo para ti</span>
      </header>
      <h3 data-testid="titulo-contexto">
        Etapa {paso + 1} de {etapas.length} — {etapa.titulo}
      </h3>
      <p className="descripcion-etapa">{contexto.descripcion}</p>
      <div className="objetivo-etapa">
        <Target size={17} />
        <div>
          <strong>Objetivo de la etapa</strong>
          <p>{contexto.objetivo}</p>
        </div>
      </div>
      {(contexto.tablas.length > 0 ||
        contexto.campos.length > 0 ||
        contexto.relaciones.length > 0) && (
        <div className="destacados-etapa">
          <span>
            <Layers size={14} /> Elementos destacados
          </span>
          {[
            { titulo: "Tablas", valores: contexto.tablas },
            { titulo: "Campos", valores: contexto.campos },
            { titulo: "Relaciones", valores: contexto.relaciones },
          ]
            .filter((g) => g.valores.length)
            .map((g) => (
              <div className="grupo-destacados" key={g.titulo}>
                <strong>{g.titulo}</strong>
                <div>
                  {g.valores.map((v: string) => (
                    <code key={v}>{v}</code>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
      <details className="detalle-tecnico-etapa">
        <summary>Consultar explicación y ejemplo</summary>
        <Explicacion esquema={esquema} estado={estado} paso={paso} />
      </details>
      {detalle && (
        <div className="detalle-control">
          <h4>
            {detalle.tabla}.{detalle.columna.nombre}
          </h4>
          <p>
            {detalle.columna.tipo} ·{" "}
            {detalle.columna.nulo ? "Permite NULL" : "Obligatorio"}
            {detalle.columna.pk ? " · PK" : ""}
            {detalle.columna.fk ? " · FK" : ""}
          </p>
        </div>
      )}
    </section>
  );
}
