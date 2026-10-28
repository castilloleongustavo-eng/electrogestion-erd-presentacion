# Verificación del rediseño en vivo

Fecha: 27 de octubre de 2026. Estado: Firebase real configurado y sincronización en la nube verificada; publicación en curso; acceso interactivo Google reservado al primer uso del propietario.

## Modelo y base original

- Se conservaron 23 tablas, 174 columnas, 30 FK declaradas y las 259 etapas originales.
- `public/esquema_erd.json` conserva el SHA-256 original: `17f5c49b36680f3bf9e27847c753a222a97e1a16038ef349e9d7b7e5cfaee856`.
- No se consultó ni modificó MySQL durante este rediseño. No se descifraron credenciales de DBeaver.

## Pruebas realizadas

- `npm test`: 12 pruebas aprobadas. Incluyen integridad del esquema y relaciones, recorrido/restauración, versión del estado, reloj de reproducción, una única ruta global y cámara proporcional a diferentes resoluciones.
- `npm run test:reglas`: 6 pruebas aprobadas contra Firebase Realtime Database Emulator, con usuarios anónimos, propietario y otro UID. Se verificaron permisos de lectura/escritura, protección de notas y autorización, rechazo de otras sesiones, borrado, revisiones antiguas, saltos, campos extra, comandos vencidos y valores fuera de rango.
- `npm run test:sincronizacion`: prueba con Firebase Auth/RTDB emulados y tres contextos de Chromium aislados: control móvil, espectador en 1920×1080 y entrada tardía en 1280×720. Aprobó navegación, zoom, selección de entidad/relación, columnas, conexiones, notas privadas, incorporación tardía, recarga, desconexión/reconexión y reproducción automática. Se valida también el resaltado de campos en la prueba final.
- Se comprobó por HTTP que un visitante no puede escribir el estado público ni leer notas. El estado público y el HTML del espectador no contienen la nota privada utilizada en la prueba.
- La pantalla pública no contiene botones, inputs, selectores, textarea ni navegación administrativa. El control de 390 px no presenta desbordamiento horizontal.
- Capturas de control móvil y proyección revisadas. Se guardan exclusivamente en `privado/`, junto con registros y credenciales aleatorias del emulador en memoria. No se publican.
- TypeScript y compilación de producción aprobados; compilación especial de pruebas separada en `dist-pruebas/`. Vite informa de un bundle mayor de 500 kB; es una advertencia y no un error de compilación.
- `npm audit`: cero vulnerabilidades después de fijar dependencias compatibles y corregir dependencias transitivas. Las versiones de app/app-compat se alinearon para compartir una única instancia del SDK Firebase.

## Lo que falta verificar

El propietario autenticó Firebase CLI con su cuenta Google. Se verificó que la aplicación web pertenece a electrogestion-erd y que el JSON coincide con la configuración oficial. La base estaba vacía y las reglas originales denegaban todo; se conservaron como respaldo privado. Google estaba habilitado y los dominios localhost y GitHub Pages ya autorizados. Se registró únicamente la cuenta Google verificada del propietario, se asignó su UID al control exclusivo, se aplicaron las reglas y se compararon por lectura directa con las revisadas. Se inicializó exclusivamente sesiones/electrogestion/publico. No se habilitó facturación ni se modificaron roles IAM.

La prueba adicional con tres navegadores aislados contra Firebase real pasó: avance, retroceso, zoom, selección de entidad/campo/relación, visibilidades, incorporación tardía, recarga, desconexión/reconexión, reproducción y diagrama completo. Los comandos de esta prueba procedían del cliente administrativo autorizado; no se presentan como clics del panel de control. La escritura anónima y las lecturas de notas y autorización fueron rechazadas con HTTP 401. El estado público no contenía la nota de prueba, eliminada tras verificarla. La sesión quedó reiniciada. El propietario indicó continuar con la publicación y entrega de los dos enlaces. El acceso Google y una acción del panel en su navegador se comprobarán en el primer uso y no se presentan como una prueba ya realizada. No se ha probado un teléfono físico en una red móvil distinta.

Se continúa el despliegue autorizado en el repositorio existente. Las rutas se comprobarán sobre GitHub Pages antes de confirmar que quedaron publicadas. El validador estructural acepta el JSON proporcionado; esto no sustituye la comprobación de reglas, identidad y sincronización del proyecto real.

Consultar `PUESTA_EN_MARCHA_FIREBASE.md` para los accesos necesarios y la comprobación real. El inventario del rediseño fue preparado y el propietario indicó continuar hasta publicar y entregar los dos enlaces.
