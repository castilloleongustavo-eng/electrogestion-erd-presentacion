export type Columna = {
  nombre: string;
  tipo: string;
  nulo: boolean;
  pk: boolean;
  fk: boolean;
  extra: string;
};
export type Tabla = {
  nombre: string;
  columnas: Columna[];
  indices: { nombre: string; unico: boolean; columnas: string[] }[];
};
export type Relacion = {
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
export type Esquema = {
  base: string;
  generado: string;
  fuente: string;
  tablas: Tabla[];
  relaciones: Relacion[];
  orden: string[];
  asociaciones: {
    tabla: string;
    extremos: string[];
    cardinalidad: string;
    fundamento: string;
    descripcion: string;
  }[];
};
