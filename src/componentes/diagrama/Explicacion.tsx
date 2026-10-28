import { useMemo } from "react";
import type { Esquema } from "../../modelos/esquema";
import type { EstadoPublico } from "../../modelos/estado";
import { generarEtapas } from "../../modelos/presentacion.mjs";
export function Explicacion({
  esquema,
  estado,
  paso,
}: {
  esquema: Esquema;
  estado: EstadoPublico;
  paso: number;
}) {
  const etapa = useMemo(() => generarEtapas(esquema), [esquema])[paso],
    r = esquema.relaciones.find(
      (r) => r.id === (estado.relacion || etapa.relacion),
    );
  const t = esquema.tablas.find(
    (t) => t.nombre === (estado.tabla || etapa.tabla),
  );
  const c = t?.columnas.find((c) => c.nombre === etapa.columna);
  const puente = esquema.asociaciones?.find((a) => a.tabla === r?.origen);
  return (
    <div className="explicacion-viva">
      <span className="ceja">
        {r ? `FK DECLARADA · ${r.cardinalidad}` : "GUÍA DEL MODELO"}
      </span>
      <h2>{r ? `${r.destino} → ${r.origen}` : etapa.titulo}</h2>
      <p>
        {r
          ? r.descripcion
          : etapa.tipo === "completo"
            ? "Todas las entidades y claves foráneas declaradas de electrogestion_db."
            : c
              ? `${c.nombre} · ${c.tipo}. ${c.pk ? "Clave primaria: identifica cada registro de forma única." : c.fk ? "Clave foránea declarada: referencia una clave del modelo." : "Atributo de la entidad."} ${c.nulo ? "Permite NULL." : "No admite NULL."}`
              : t
                ? `${t.nombre}: ${t.columnas.length} atributos. Sus columnas y claves se revelan progresivamente.`
                : "El modelo se construye una entidad y una relación a la vez."}
      </p>
      {r && (
        <>
          <div className="pares-claves">
            <span>
              FK{" "}
              <b>
                {r.origen}.{r.columnas.join(", ")}
              </b>
            </span>
            <span>
              Referencia{" "}
              <b>
                {r.destino}.{r.referencias.join(", ")}
              </b>
            </span>
          </div>
          <p className="ejemplo-vivo">{r.ejemplo}</p>
        </>
      )}
      {puente && (
        <p className="ejemplo-vivo">
          Tabla intermedia N:M: {puente.descripcion} {puente.fundamento}
        </p>
      )}
    </div>
  );
}
