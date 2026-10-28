export type EstadoPublico = {
  formato: number;
  revision: number;
  modelo: string;
  paso: number;
  pantalla: "inicio" | "diagrama";
  columnas: boolean;
  relaciones: boolean;
  enfoque: boolean;
  claves: boolean;
  animaciones: boolean;
  explicaciones: boolean;
  indicador: boolean;
  tabla: string;
  campo: string;
  relacion: string;
  foco: "automatico" | "tabla" | "relacion" | "completo";
  camara: { x: number; y: number; zoom: number };
  reproduccion: {
    activa: boolean;
    desdePaso: number;
    desdeServidor: number;
    intervaloMs: number;
  };
  solicitadoEn: number;
  actualizadoEn: number;
  actualizadoPor: string;
};
export type Cambio =
  | {
      tipo:
        | "siguiente"
        | "anterior"
        | "reiniciar"
        | "iniciar"
        | "completo"
        | "reproducir"
        | "pausar"
        | "ajustar";
    }
  | { tipo: "ir"; paso: number }
  | { tipo: "tabla"; tabla: string; paso: number }
  | { tipo: "columna"; tabla: string; campo: string; paso: number }
  | { tipo: "relacion"; relacion: string; paso: number }
  | { tipo: "camara"; camara: Partial<EstadoPublico["camara"]> }
  | { tipo: "opcion"; campo: string; valor: boolean };
