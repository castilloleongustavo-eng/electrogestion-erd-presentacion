import { Panel } from "@xyflow/react";
import { Plus, Minus, Hand, Scan, ArrowLeft, ArrowRight } from "lucide-react";
export function ControlesVista({
  mano,
  cambiarMano,
  zoom,
  acercar,
  alejar,
  centrar,
  bloqueado,
  centrarBloqueado = false,
  navegacion,
}: {
  mano: boolean;
  cambiarMano: () => void;
  zoom: number;
  acercar: () => void;
  alejar: () => void;
  centrar: () => void;
  bloqueado: boolean;
  centrarBloqueado?: boolean;
  navegacion?: {
    anterior: () => void;
    siguiente: () => void;
    anteriorBloqueado: boolean;
    siguienteBloqueado: boolean;
  };
}) {
  return (
    <Panel
      position="bottom-left"
      className="controles-vista nopan nodrag nowheel"
      aria-label="Navegación del diagrama"
    >
      <button
        type="button"
        aria-label="Acercar zoom"
        title="Acercar (+)"
        disabled={bloqueado || zoom >= 4 - 0.001}
        onClick={acercar}
      >
        <Plus size={19} />
      </button>
      <button
        type="button"
        aria-label="Alejar zoom"
        title="Alejar (−)"
        disabled={bloqueado || zoom <= 0.25 + 0.001}
        onClick={alejar}
      >
        <Minus size={19} />
      </button>
      <span className="separador-vista" />
      <button
        type="button"
        aria-label="Herramienta de mano"
        title={mano ? "Desactivar arrastre" : "Activar arrastre"}
        aria-pressed={mano}
        disabled={bloqueado}
        onClick={cambiarMano}
      >
        <Hand size={18} />
      </button>
      <button
        type="button"
        aria-label="Centrar diagrama"
        title="Ajustar y centrar el diagrama"
        disabled={bloqueado || centrarBloqueado}
        onClick={centrar}
      >
        <Scan size={18} />
      </button>
      <output aria-label="Zoom relativo">{Math.round(zoom * 100)}%</output>
      {navegacion && (
        <>
          <span className="separador-vista" />
          <button
            type="button"
            aria-label="Anterior"
            title="Etapa anterior"
            disabled={navegacion.anteriorBloqueado}
            onClick={navegacion.anterior}
          >
            <ArrowLeft size={20} />
          </button>
          <button
            type="button"
            aria-label="Siguiente"
            title="Etapa siguiente"
            disabled={navegacion.siguienteBloqueado}
            onClick={navegacion.siguiente}
          >
            <ArrowRight size={20} />
          </button>
        </>
      )}
    </Panel>
  );
}
