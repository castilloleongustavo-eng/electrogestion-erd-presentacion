// La secuencia es una función pura: retroceder reconstruye el mismo estado.
export function ordenarTablas(esquema, preferencia = []) {
  const pendientes = new Set(esquema.tablas.map((t) => t.nombre)),
    orden = [];
  const prioridad = [...preferencia, ...pendientes];
  while (pendientes.size) {
    const siguiente =
      prioridad.find(
        (n) =>
          pendientes.has(n) &&
          esquema.relaciones
            .filter((r) => r.origen === n && r.destino !== n)
            .every((r) => !pendientes.has(r.destino)),
      ) || prioridad.find((n) => pendientes.has(n));
    orden.push(siguiente);
    pendientes.delete(siguiente);
  }
  return orden;
}
/** @typedef {{tipo:string,titulo:string,tablas:string[],columnas:Record<string,number>,relaciones:string[],tabla?:string,columna?:string,relacion?:string}} Etapa */
/** @returns {Etapa[]} */
export function generarEtapas(esquema, preferencia = []) {
  const orden =
    preferencia.length === esquema.tablas.length &&
    new Set(preferencia).size === preferencia.length &&
    preferencia.every((n) => esquema.tablas.some((t) => t.nombre === n))
      ? preferencia
      : ordenarTablas(esquema, preferencia);
  /** @type {Etapa[]} */
  const etapas = [
    {
      tipo: "inicio",
      titulo: "Todo empieza con una entidad",
      tablas: [],
      columnas: {},
      relaciones: [],
    },
  ];
  let estado = etapas[0];
  const agregar = (datos) => {
    estado = {
      ...estado,
      ...datos,
      tablas: [...(datos.tablas || estado.tablas)],
      columnas: { ...(datos.columnas || estado.columnas) },
      relaciones: [...(datos.relaciones || estado.relaciones)],
    };
    etapas.push(estado);
  };
  const vistas = new Set();
  for (const nombre of orden) {
    const tabla = esquema.tablas.find((t) => t.nombre === nombre);
    agregar({
      tipo: "tabla",
      titulo: `Conoce ${nombre}`,
      tabla: nombre,
      relacion: undefined,
      tablas: [...estado.tablas, nombre],
      columnas: { ...estado.columnas, [nombre]: 0 },
    });
    tabla.columnas.forEach((c, i) =>
      agregar({
        tipo: "columna",
        titulo: `${nombre} · ${c.nombre}`,
        columna: c.nombre,
        columnas: { ...estado.columnas, [nombre]: i + 1 },
      }),
    );
    for (const r of esquema.relaciones.filter(
      (r) =>
        !vistas.has(r.id) &&
        estado.tablas.includes(r.origen) &&
        estado.tablas.includes(r.destino),
    )) {
      agregar({
        tipo: "relacion",
        titulo: `${r.destino} → ${r.origen}`,
        relacion: r.id,
        relaciones: [...estado.relaciones, r.id],
      });
      agregar({
        tipo: "explicacion",
        titulo: "La relación, paso a paso",
        relacion: r.id,
      });
      vistas.add(r.id);
    }
  }
  agregar({
    tipo: "completo",
    titulo: "Un sistema. Todas sus conexiones.",
    tabla: undefined,
    relacion: undefined,
  });
  return etapas;
}
export function validarEsquema(e) {
  if (!e.tablas?.length) throw Error("El esquema no contiene tablas.");
  for (const r of e.relaciones) {
    const a = e.tablas.find((t) => t.nombre === r.origen),
      b = e.tablas.find((t) => t.nombre === r.destino);
    if (
      !a ||
      !b ||
      r.columnas.length !== r.referencias.length ||
      !r.columnas.every((c) => a.columnas.some((x) => x.nombre === c)) ||
      !r.referencias.every((c) => b.columnas.some((x) => x.nombre === c))
    )
      throw Error(`Relación inválida: ${r.id}`);
  }
  return true;
}
