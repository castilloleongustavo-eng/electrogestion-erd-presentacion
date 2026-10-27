import mysql from "mysql2/promise";

// Todas las consultas están limitadas a INFORMATION_SCHEMA y al esquema elegido.
export async function extraer(configuracion) {
  const conexion = await mysql.createConnection({
    ...configuracion,
    multipleStatements: false,
  });
  const base = configuracion.database;
  try {
    await conexion.query("SET SESSION TRANSACTION READ ONLY");
    const consultar = async (sql) => (await conexion.execute(sql, [base]))[0];
    const tablas = await consultar(
      "SELECT TABLE_NAME nombre FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",
    );
    const columnas = await consultar(
      "SELECT TABLE_NAME tabla, COLUMN_NAME nombre, COLUMN_TYPE tipo, IS_NULLABLE nulo, ORDINAL_POSITION posicion, EXTRA extra FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, ORDINAL_POSITION",
    );
    const indices = await consultar(
      "SELECT TABLE_NAME tabla, INDEX_NAME nombre, NON_UNIQUE noUnico, COLUMN_NAME columna, SEQ_IN_INDEX posicion FROM INFORMATION_SCHEMA.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX",
    );
    const claves = await consultar(
      "SELECT TABLE_NAME origen, CONSTRAINT_NAME nombre, COLUMN_NAME columna, REFERENCED_TABLE_NAME destino, REFERENCED_COLUMN_NAME referencia, ORDINAL_POSITION posicion FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE WHERE CONSTRAINT_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME, CONSTRAINT_NAME, ORDINAL_POSITION",
    );
    const reglas = await consultar(
      "SELECT TABLE_NAME tabla, CONSTRAINT_NAME nombre, UPDATE_RULE actualizar, DELETE_RULE eliminar FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=?",
    );
    const entidades = tablas.map((t) => {
      const agrupados = new Map();
      indices
        .filter((i) => i.tabla === t.nombre)
        .forEach((i) => {
          if (!agrupados.has(i.nombre))
            agrupados.set(i.nombre, {
              nombre: i.nombre,
              unico: !i.noUnico,
              columnas: [],
            });
          agrupados.get(i.nombre).columnas.push(i.columna);
        });
      const lista = [...agrupados.values()];
      return {
        ...t,
        columnas: columnas
          .filter((c) => c.tabla === t.nombre)
          .map((c) => ({
            nombre: c.nombre,
            tipo: c.tipo,
            nulo: c.nulo === "YES",
            extra: c.extra,
            pk: lista.some(
              (i) => i.nombre === "PRIMARY" && i.columnas.includes(c.nombre),
            ),
            fk: claves.some(
              (k) => k.origen === t.nombre && k.columna === c.nombre,
            ),
          })),
        indices: lista,
      };
    });
    const agrupadas = new Map();
    claves.forEach((k) => {
      const id = `${k.origen}.${k.nombre}`;
      if (!agrupadas.has(id))
        agrupadas.set(id, {
          id,
          nombre: k.nombre,
          origen: k.origen,
          destino: k.destino,
          columnas: [],
          referencias: [],
          declarada: true,
        });
      agrupadas.get(id).columnas.push(k.columna);
      agrupadas.get(id).referencias.push(k.referencia);
    });
    const relaciones = [...agrupadas.values()].map((r) => {
      const origen = entidades.find((t) => t.nombre === r.origen);
      const destino = entidades.find((t) => t.nombre === r.destino);
      const unica = origen.indices.some(
        (i) => i.unico && i.columnas.every((c) => r.columnas.includes(c)),
      );
      const destinoUnico = destino.indices.some(
        (i) => i.unico && i.columnas.every((c) => r.referencias.includes(c)),
      );
      const opcional = r.columnas.some(
        (n) => origen.columnas.find((c) => c.nombre === n).nulo,
      );
      const regla = reglas.find(
        (k) => k.tabla === r.origen && k.nombre === r.nombre,
      );
      return {
        ...r,
        cardinalidad: destinoUnico ? (unica ? "1:1" : "1:N") : "no determinada",
        opcional,
        destinoUnico,
        reglas: { actualizar: regla.actualizar, eliminar: regla.eliminar },
        descripcion: `${r.origen} referencia a ${r.destino} mediante ${r.columnas.join(", ")}. ${destinoUnico ? `Cada registro de origen puede apuntar a ${opcional ? "cero o un" : "un"} registro de destino; un registro de destino admite ${unica ? "como máximo una referencia" : "cero o muchas referencias"}.` : "El índice de destino no garantiza unicidad; no se atribuye una cardinalidad."}`,
        ejemplo: `Ejemplo ilustrativo: ${r.origen}.${r.columnas.join(", ")} = 7 referencia ${r.destino}.${r.referencias.join(", ")} = 7. No son datos extraídos.`,
      };
    });
    // Una asociación N:M se explica solo si dos FK 1:N y un índice único
    // sobre su combinación permiten demostrar el papel de la tabla puente.
    const asociaciones = entidades.flatMap((t) => {
      const fk = relaciones.filter((r) => r.origen === t.nombre);
      if (
        fk.length !== 2 ||
        fk.some((r) => r.cardinalidad !== "1:N" || r.opcional)
      )
        return [];
      const campos = [...new Set(fk.flatMap((r) => r.columnas))];
      const indice = t.indices.find(
        (i) =>
          i.unico &&
          i.columnas.length === campos.length &&
          campos.every((c) => i.columnas.includes(c)),
      );
      return indice
        ? [
            {
              tabla: t.nombre,
              extremos: fk.map((r) => r.destino),
              cardinalidad: "N:M",
              fundamento: `Índice único ${indice.nombre} (${indice.columnas.join(", ")}) y dos FK 1:N obligatorias.`,
              descripcion: `${t.nombre} enlaza ${fk[0].destino} con ${fk[1].destino}. Cada extremo puede aparecer en varias filas del enlace, pero la combinación no se repite.`,
            },
          ]
        : [];
    });
    return {
      version: 1,
      base,
      fuente: "INFORMATION_SCHEMA · MySQL/MariaDB local",
      generado: new Date().toISOString(),
      tablas: entidades,
      relaciones,
      asociaciones,
    };
  } finally {
    await conexion.end();
  }
}
