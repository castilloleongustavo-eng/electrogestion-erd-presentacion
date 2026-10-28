# Verificación del rediseño en vivo

Fecha: 27 de octubre de 2026. Estado: Firebase real configurado y sincronización en la nube verificada; publicación verificada; acceso interactivo Google confirmado por el propietario y por Firebase.

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

La prueba adicional con tres navegadores aislados contra Firebase real pasó: avance, retroceso, zoom, selección de entidad/campo/relación, visibilidades, incorporación tardía, recarga, desconexión/reconexión, reproducción y diagrama completo. Los comandos de esta prueba procedían del cliente administrativo autorizado; no se presentan como clics del panel de control. La escritura anónima y las lecturas de notas y autorización fueron rechazadas con HTTP 401. El estado público no contenía la nota de prueba, eliminada tras verificarla. La sesión quedó reiniciada. El propietario indicó continuar con la publicación y entrega de los dos enlaces. El propietario confirmó manualmente el acceso Google y el avance desde el panel; Authentication registró el inicio web con el UID correcto. No se ha probado un teléfono físico en una red móvil distinta.

El despliegue autorizado terminó en el repositorio existente. Ambas rutas se comprobaron sobre GitHub Pages y quedaron publicadas. El validador estructural acepta el JSON proporcionado; esto no sustituye la comprobación de reglas, identidad y sincronización del proyecto real.

Consultar `PUESTA_EN_MARCHA_FIREBASE.md` para los accesos necesarios y la comprobación real. El inventario del rediseño fue preparado y el propietario indicó continuar hasta publicar y entregar los dos enlaces.
## Publicación final verificada

- GitHub Actions terminó correctamente: https://github.com/castilloleongustavo-eng/electrogestion-erd-presentacion/actions/runs/40608030265 . Pasaron instalación, 12 pruebas del modelo/estado, 6 pruebas de reglas en emulador, validación de configuración, compilación y despliegue.
- Código desplegado: 4ea335b18abae30eec483e63f76573aa651a9ba6.
- Control: https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/control . HTTP 200; muestra acceso con Google; el visitante anónimo no ve navegación privada ni notas. Vista móvil de 390 px sin desbordamiento.
- Presentación: https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/presentacion . HTTP 200; conexión a Firebase real; sin botones, menús, inputs, notas ni herramientas administrativas. Recursos sin errores HTTP ni excepciones JavaScript durante la comprobación.
- Se repitió la prueba de sincronización con tres navegadores sobre las páginas públicas de GitHub Pages, usando comandos administrativos de prueba: etapas, foco, zoom, campos, columnas, relaciones, incorporación tardía, recarga, reconexión y reproducción. Se mantuvo una sola sesión. Se verificaron las 23 entidades, 174 columnas y 30 relaciones en la vista completa.
- Las lecturas anónimas de notas y autorización siguieron rechazadas con HTTP 401, al igual que la escritura anónima del estado. No hubo peticiones a localhost, MySQL o al backend local desde las páginas publicadas.
- El propietario confirmó que entró con Google y pulsó Siguiente en el control. Se comprobó después que Authentication registró el acceso web y que el UID coincidía con el único presentador autorizado. Esta validación manual se distingue de la automatización de los comandos administrativos.
- Se eliminó exclusivamente la nota temporal generada por las pruebas, conservando cualquier nota previa. La sesión quedó reiniciada en pantalla inicial, etapa 0, revisión 44 al cerrar las pruebas. Las revisiones posteriores dependen del uso del presentador.
- Las pruebas y capturas con credenciales o contexto administrativo permanecen excluidas en privado/. No se modificó MySQL, no se habilitó facturación y no se crearon sesiones ni repositorios adicionales.

El uso desde un teléfono físico en una red móvil distinta no se comprobó directamente; el sistema publicado utiliza Firebase por Internet y no depende de la computadora de desarrollo.
## Acceso persistente del presentador

- Firebase Authentication utiliza persistencia local en lugar de persistencia de pestaña. La aplicación no aplica cierre por inactividad; se conserva el acceso en el mismo navegador hasta cerrar sesión, borrar sus datos o revocar la cuenta.
- Se verificó con Auth/RTDB emulados y un perfil real de Chromium: iniciar sesión, cerrar por completo el proceso, abrir de nuevo y recuperar el control sin introducir credenciales; cerrar sesión explícitamente y comprobar que al reiniciar se solicita acceso. La única sesión global conservó su estado entre aperturas.
- No se modifican reglas, usuarios autorizados, notas ni estado del proyecto Firebase real para esta actualización.

## Actualización de controles flotantes y contexto privado

- 16 pruebas del modelo, estado, contexto y geometría aprobadas. Las 259 etapas tienen descripción y objetivo; los nombres destacados se validan contra el esquema real. La cámara conserva centro y factor relativo al pasar de 390 px a resoluciones de proyector, sin coordenadas de pantalla en Firebase.
- Prueba completa de navegadores con Firebase Auth/RTDB emulados aprobada. Incluye zoom con +/−, activación y desactivación de mano, arrastre de mouse, rueda, arrastre táctil y pellizco mediante eventos de Chromium. Los movimientos se reflejaron en el espectador y se agruparon para evitar una escritura por evento. Se comprobó el centrado después de finalizar el gesto y su confirmación.
- El contexto privado se comprobó entre la vista previa y la navegación. La pantalla pública no contiene ese contexto ni controles y no puede escribir al usar gestos o flechas.
- Se ejecutaron también las comprobaciones existentes de etapas, relaciones, notas privadas, acceso, recarga, entrada tardía, desconexión, reconexión y reproducción.
- No se modificaron las reglas Firebase, el sistema de autenticación, la estructura del estado, la sesión electrogestion, el generador de etapas ni esquema_erd.json. No se consultó ni modificó MySQL. Los servicios reales no se reconfiguraron para este ajuste de interfaz.
- Tacto comprobado mediante emulación de eventos del navegador; no se afirma una prueba en teléfono físico.
