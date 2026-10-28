import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  type User,
} from "firebase/auth";
import { get, ref } from "firebase/database";
import type { Servicios } from "../sincronizacion/firebase";
export function usePresentador(servicios: Servicios) {
  const [usuario, setUsuario] = useState<User | null>(null),
    [autorizado, setAutorizado] = useState(false),
    [cargando, setCargando] = useState(true),
    [error, setError] = useState("");
  useEffect(() => {
    let vigente = true;
    const cancelar = onAuthStateChanged(servicios.auth, async (user) => {
      setUsuario(user);
      setAutorizado(false);
      setCargando(true);
      setError("");
      if (!user) {
        setCargando(false);
        return;
      }
      try {
        const uid = user.uid;
        const v = await get(ref(servicios.db, "autorizacion/presentadorUid"));
        if (vigente && servicios.auth.currentUser?.uid === uid)
          setAutorizado(v.val() === uid);
      } catch {
        if (vigente)
          setError("Esta cuenta no está autorizada como presentador.");
      } finally {
        if (vigente) setCargando(false);
      }
    });
    return () => {
      vigente = false;
      cancelar();
    };
  }, [servicios]);
  async function entrar() {
    setError("");
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await signInWithPopup(servicios.auth, provider);
    } catch {
      setError(
        "No se pudo iniciar sesión. Permite la ventana de acceso y comprueba el proveedor Google y los dominios autorizados.",
      );
    }
  }
  return {
    usuario,
    autorizado,
    cargando,
    error,
    entrar,
    salir: () => signOut(servicios.auth),
  };
}
