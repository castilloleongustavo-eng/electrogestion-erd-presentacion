import { motion } from "motion/react";
import { Database, KeyRound, Link2 } from "lucide-react";
import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";
import type { Tabla, Columna } from "../../modelos/esquema";
export type DatosEntidad = {
  tabla: Tabla;
  cantidad: number;
  activo: boolean;
  resaltados: string[];
  claves: boolean;
  animaciones: boolean;
  seleccionar?: (tabla: string, columna: Columna) => void;
};
export type NodoEntidad = Node<DatosEntidad, "entidad">;
export function Entidad({ data }: NodeProps<NodoEntidad>) {
  return (
    <motion.div
      initial={data.animaciones ? { opacity: 0, y: 20 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: data.animaciones ? 0.35 : 0 }}
      className={`entidad ${data.activo ? "activa" : ""}`}
    >
      <header>
        <Database size={15} />
        <strong>{data.tabla.nombre}</strong>
        <span>{data.tabla.columnas.length}</span>
      </header>
      <div className="filas">
        {data.tabla.columnas.slice(0, data.cantidad).map((c) => (
          <motion.div
            initial={data.animaciones ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: data.animaciones ? 0.25 : 0 }}
            key={c.nombre}
            className={`fila ${data.resaltados.includes(c.nombre) ? "resaltada" : ""}`}
            role={data.seleccionar ? "button" : undefined}
            tabIndex={data.seleccionar ? 0 : undefined}
            onClick={() => data.seleccionar?.(data.tabla.nombre, c)}
            onKeyDown={(e) => {
              if (e.key === "Enter") data.seleccionar?.(data.tabla.nombre, c);
            }}
          >
            <Handle type="target" position={Position.Left} id={c.nombre} />
            <span
              className={
                data.claves ? (c.pk ? "pk" : c.fk ? "fk" : "neutro") : "neutro"
              }
            >
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
          </motion.div>
        ))}
      </div>
      {!data.cantidad && (
        <p className="sin-columnas">Una entidad del sistema</p>
      )}
    </motion.div>
  );
}
