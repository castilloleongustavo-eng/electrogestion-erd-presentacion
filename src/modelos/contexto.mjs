// Contexto privado derivado del esquema y de la secuencia existente.
// No genera etapas, relaciones sugeridas ni datos de negocio.
export function describirEtapa(esquema, etapa) {
  const tabla = esquema.tablas.find((t) => t.nombre === etapa.tabla);
  const relacion = esquema.relaciones.find((r) => r.id === etapa.relacion);
  const columna = tabla?.columnas.find((c) => c.nombre === etapa.columna);
  let descripcion = "",
    objetivo = "",
    tablas = [],
    campos = [],
    relaciones = [];
  switch (etapa.tipo) {
    case "inicio":
      descripcion = `El lienzo de ${esquema.base} comienza vacío. El recorrido construirá ${esquema.tablas.length} entidades y ${esquema.relaciones.length} relaciones declaradas.`;
      objetivo =
        "Presentar la idea de entidad, atributo y relación antes de construir el modelo.";
      break;
    case "tabla":
      if (!tabla) break;
      tablas = [tabla.nombre];
      descripcion = `Aparece ${tabla.nombre}, una entidad con ${tabla.columnas.length} columnas. Sus atributos se desplegarán de forma progresiva.`;
      objetivo = `Explicar qué representa una entidad y preparar la lectura de los atributos y claves de ${tabla.nombre}.`;
      break;
    case "columna":
      if (!tabla || !columna) break;
      tablas = [tabla.nombre];
      campos = [`${tabla.nombre}.${columna.nombre}`];
      descripcion =
        `Se revela ${tabla.nombre}.${columna.nombre}, de tipo ${columna.tipo}. ${columna.nulo ? "Permite NULL." : "No admite NULL."} ${columna.pk ? "Forma parte de la clave primaria." : ""} ${columna.fk ? "Participa en una clave foránea declarada." : ""}`.trim();
      objetivo = columna.pk
        ? "Explicar cómo la clave primaria identifica de forma única cada registro."
        : columna.fk
          ? "Identificar el campo que participa en una restricción referencial, sin inferir conexiones adicionales."
          : "Explicar qué propiedad describe el atributo, su tipo de dato y su nulabilidad.";
      break;
    case "relacion":
    case "explicacion":
      if (!relacion) break;
      tablas = [...new Set([relacion.origen, relacion.destino])];
      campos = [
        ...relacion.columnas.map((c) => `${relacion.origen}.${c}`),
        ...relacion.referencias.map((c) => `${relacion.destino}.${c}`),
      ];
      relaciones = [relacion.nombre];
      descripcion = relacion.descripcion;
      objetivo = `Explicar la referencia de ${relacion.origen} a ${relacion.destino}, las columnas involucradas y cómo la restricción mantiene la integridad referencial. La cardinalidad verificada en los metadatos se lee desde el destino hacia el origen (${relacion.cardinalidad}).`;
      break;
    case "completo":
      tablas = esquema.tablas.map((t) => t.nombre);
      descripcion = `El modelo completo reúne ${esquema.tablas.length} tablas y ${esquema.relaciones.length} claves foráneas declaradas, conservando las entidades de las etapas anteriores.`;
      objetivo =
        "Recapitular el papel de las entidades y de sus conexiones, distinguiendo claves primarias, foráneas y tablas intermedias verificadas.";
      break;
  }
  return { descripcion, objetivo, tablas, campos, relaciones };
}
