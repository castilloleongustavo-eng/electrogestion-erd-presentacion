export const SESION = "electrogestion";
export const RUTA_PUBLICA = "sesiones/electrogestion/publico";
export const RUTA_NOTAS = "privado/electrogestion/notas";
export function crearEstado(modelo, ahora, uid) {
  return {
    formato: 1,
    revision: 1,
    modelo,
    paso: 0,
    pantalla: "inicio",
    columnas: true,
    relaciones: true,
    enfoque: false,
    claves: true,
    animaciones: true,
    explicaciones: true,
    indicador: true,
    tabla: "",
    campo: "",
    relacion: "",
    foco: "automatico",
    camara: { x: 0.5, y: 0.5, zoom: 1 },
    reproduccion: {
      activa: false,
      desdePaso: 0,
      desdeServidor: 0,
      intervaloMs: 2800,
    },
    solicitadoEn: ahora,
    actualizadoEn: ahora,
    actualizadoPor: uid,
  };
}
export function pasoEnTiempo(estado, ahora, total) {
  if (!estado) return 0;
  const r = estado.reproduccion;
  return Math.min(
    total - 1,
    Math.max(
      0,
      r.activa
        ? r.desdePaso +
            Math.floor(Math.max(0, ahora - r.desdeServidor) / r.intervaloMs)
        : estado.paso,
    ),
  );
}
export function aceptarVersion(actual, nuevo) {
  return nuevo && (!actual || nuevo.revision > actual.revision)
    ? nuevo
    : actual;
}
export function aplicarCambio(estado, cambio, ahora, total, uid) {
  const paso = pasoEnTiempo(estado, ahora, total);
  const base = {
    ...estado,
    paso,
    reproduccion: { ...estado.reproduccion },
    revision: estado.revision + 1,
    solicitadoEn: ahora,
    actualizadoEn: ahora,
    actualizadoPor: uid,
  };
  const navegar = (n) => ({
    ...base,
    paso: Math.max(0, Math.min(total - 1, n)),
    pantalla: "diagrama",
    tabla: "",
    campo: "",
    relacion: "",
    foco: "automatico",
    camara: { x: 0.5, y: 0.5, zoom: 1 },
    reproduccion: { ...base.reproduccion, activa: false },
  });
  switch (cambio.tipo) {
    case "siguiente":
      return navegar(paso + 1);
    case "anterior":
      return navegar(paso - 1);
    case "ir":
      return navegar(cambio.paso);
    case "reiniciar":
      return { ...navegar(0), pantalla: "inicio" };
    case "iniciar":
      return navegar(0);
    case "completo":
      return { ...navegar(total - 1), foco: "completo" };
    case "reproducir":
      return {
        ...base,
        pantalla: "diagrama",
        reproduccion: {
          ...base.reproduccion,
          activa: true,
          desdePaso: paso,
          desdeServidor: ahora,
        },
      };
    case "pausar":
      return { ...base, reproduccion: { ...base.reproduccion, activa: false } };
    case "tabla":
      return { ...navegar(cambio.paso), tabla: cambio.tabla, foco: "tabla" };
    case "columna":
      return {
        ...navegar(Math.max(paso, cambio.paso)),
        tabla: cambio.tabla,
        campo: cambio.campo,
        foco: "tabla",
      };
    case "relacion":
      return {
        ...navegar(cambio.paso),
        relacion: cambio.relacion,
        foco: "relacion",
      };
    case "ajustar":
      return { ...base, foco: "completo", camara: { x: 0.5, y: 0.5, zoom: 1 } };
    case "camara":
      return { ...base, camara: { ...base.camara, ...cambio.camara } };
    case "opcion": {
      if (
        ![
          "columnas",
          "relaciones",
          "enfoque",
          "claves",
          "animaciones",
          "explicaciones",
          "indicador",
        ].includes(cambio.campo) ||
        typeof cambio.valor !== "boolean"
      )
        throw Error("Opción no permitida.");
      return {
        ...base,
        [cambio.campo]: cambio.valor,
        ...(cambio.campo === "enfoque" ? { foco: "automatico" } : {}),
      };
    }
    default:
      throw Error("Acción no permitida.");
  }
}
