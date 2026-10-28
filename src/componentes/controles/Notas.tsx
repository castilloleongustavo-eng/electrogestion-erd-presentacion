import { useEffect, useState } from "react";
import { onValue, ref, set } from "firebase/database";
import { LockKeyhole, Save } from "lucide-react";
import type { Servicios } from "../../servicios/sincronizacion/firebase";
import { RUTA_NOTAS } from "../../modelos/estado.mjs";
export function Notas({
  servicios,
  paso,
  conectado,
}: {
  servicios: Servicios;
  paso: number;
  conectado: boolean;
}) {
  const [texto, setTexto] = useState(""),
    [guardado, setGuardado] = useState(""),
    [error, setError] = useState(""),
    [ocupado, setOcupado] = useState(false);
  useEffect(() => {
    setError("");
    setTexto("");
    setGuardado("");
    return onValue(
      ref(servicios.db, `${RUTA_NOTAS}/${paso}`),
      (s) => {
        const t = s.val() || "";
        setTexto(t);
        setGuardado(t);
      },
      () => setError("No se pueden leer las notas privadas."),
    );
  }, [servicios, paso]);
  async function guardar() {
    setOcupado(true);
    setError("");
    try {
      await set(ref(servicios.db, `${RUTA_NOTAS}/${paso}`), texto);
      setGuardado(texto);
    } catch {
      setError("No se pudo guardar la nota.");
    } finally {
      setOcupado(false);
    }
  }
  return (
    <section className="tarjeta-control notas-control">
      <header>
        <LockKeyhole size={17} />
        <h2>Notas privadas</h2>
        <span>Etapa {paso + 1}</span>
      </header>
      <textarea
        aria-label="Notas privadas del presentador"
        value={texto}
        maxLength={20000}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Tus apuntes para esta etapa. Solo tu cuenta puede leerlos."
      />
      <div className="nota-acciones">
        <small>
          {texto !== guardado
            ? "Cambios sin guardar"
            : "Guardado en tu espacio privado"}
        </small>
        <button
          onClick={() => void guardar()}
          disabled={!conectado || ocupado || texto === guardado}
        >
          <Save size={15} /> Guardar nota
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
    </section>
  );
}
