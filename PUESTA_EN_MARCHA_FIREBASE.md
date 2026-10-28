# Una aplicación, dos enlaces, una sesión global

El repositorio existente contiene una sola aplicación React con HashRouter. Las rutas son `#/control` y `#/presentacion`. Ambas consumen el mismo esquema y escuchan exactamente `sesiones/electrogestion/publico`. El identificador es constante; no existen selector de sesión, creación de otras sesiones ni presentación independiente en cada navegador.

El propietario confirmó el proyecto electrogestion-erd, proporcionó su configuración web, autenticó Firebase CLI y solicitó continuar con la publicación y entrega de los dos enlaces. Google Authentication está habilitado, la cuenta verificada del propietario está vinculada al UID autorizado, las reglas fueron aplicadas y leídas de nuevo, y la única sesión electrogestion está inicializada. No se crearon proyectos adicionales ni se activó facturación. Los apartados siguientes documentan la configuración y su mantenimiento.

## Qué acceso se necesita

1. Proyecto Firebase elegido por el propietario: ID y aplicación web registrada.
2. Firebase Realtime Database habilitado, con su URL HTTPS exacta. No se utiliza Firestore.
3. Firebase Authentication con proveedor Google activado y `castilloleongustavo-eng.github.io` incluido en los dominios autorizados. La cuenta Google que usará el presentador debe estar decidida.
4. UID Firebase Authentication de esa cuenta. El UID se obtiene en Authentication → Users. Es distinto del nombre de GitHub, correo o ID del proyecto. Nadie se autoriza solo por iniciar sesión.
5. Permiso administrativo temporal para desplegar **las reglas de este repositorio** y escribir únicamente la configuración `/autorizacion` de esta aplicación. Se puede gestionar mediante el plugin oficial Firebase conectado o con una sesión autenticada de Firebase CLI. No se necesitan contraseñas pegadas en el chat ni archivos de cuenta de servicio en el repositorio.
6. Autorización para publicar en el repositorio existente tras revisar `INVENTARIO_PUBLICACION.md` y comprobar las reglas reales.

No se debe crear un proyecto adicional, habilitar facturación o cambiar un plan sin autorización explícita del propietario. Antes de aplicar configuración, revisar la estructura y reglas existentes del proyecto seleccionado. Si Firebase ya aloja otros datos o aplicaciones, preparar una integración de reglas que conserve sus permisos; no reemplazar a ciegas reglas ajenas.

## Configuración web pública

La aplicación carga `firebase-config.json` en tiempo de ejecución. El archivo del repositorio contiene la configuración pública autorizada de electrogestion-erd. Ejemplo de **forma**, sin claves reales:

```json
{
  "habilitado": true,
  "apiKey": "API_KEY_WEB_DEL_PROYECTO",
  "authDomain": "ID_PROYECTO.firebaseapp.com",
  "databaseURL": "https://INSTANCIA.REGION.firebasedatabase.app",
  "projectId": "ID_PROYECTO",
  "appId": "APP_ID_WEB"
}
```

Estos identificadores web se entregan necesariamente al navegador y no conceden permisos administrativos. Firebase documenta la diferencia entre [configuración web/API keys y autorización mediante reglas](https://firebase.google.com/docs/projects/api-keys). No incluir contraseñas, refresh tokens, JSON de cuentas de servicio, claves privadas, notas ni credenciales MySQL. La lista de campos de configuración está limitada por el validador de publicación.

Guardar el JSON autorizado como variable de repositorio **FIREBASE_WEB_CONFIG** en Settings → Secrets and variables → Actions → Variables. GitHub Actions lo valida y genera el archivo público de la compilación; no se introducen credenciales administrativas en CI. También se puede preparar localmente el archivo público para probar el proyecto real antes de subirlo. No cargar parámetros de emulador en una compilación pública.

## Reglas y propietario

`firebase/database.rules.json` deniega por defecto. Permite lectura anónima exclusivamente de `sesiones/electrogestion/publico`. Las escrituras públicas y la lectura/escritura de notas requieren `auth.uid === /autorizacion/presentadorUid`. Los clientes no pueden modificar esa autorización, borrar la sesión ni crear otra. La validación limita campos, rangos, revisión, versión del esquema y vencimiento de comandos.

Preparar la configuración del UID real sin tocar servicios externos:

```sh
node scripts/preparar-modelo.mjs
node scripts/preparar-autorizacion.mjs UID_REAL_FIREBASE
```

Genera `privado/autorizacion.json`, excluido de Git, con `presentadorUid`, hash del esquema y total de etapas. Revisar el ID del proyecto y la instancia, las reglas existentes y el contenido antes de aplicarlo.

Solo después de la autorización y revisión, una sesión administrativa de Firebase CLI puede desplegar las reglas y aplicar la configuración preparada. Para una base dedicada a esta aplicación:

```sh
npx firebase deploy --only database --project ID_PROYECTO
npx firebase database:update /autorizacion privado/autorizacion.json --project ID_PROYECTO --instance NOMBRE_INSTANCIA
```

Esos comandos escriben configuración Firebase, **no MySQL**. No usar `database:set /` ni cargar dumps completos. Si el proyecto tiene varias instancias, seleccionar explícitamente la instancia correcta también en la configuración de despliegue de reglas antes de ejecutar. Las reglas se deben leer de nuevo desde la instancia real después de desplegarlas y compararse con las revisadas.

Con la configuración pública y las reglas aplicadas, abrir `#/control`, acceder con Google y pulsar **Inicializar sesión global**. La cuenta autorizada crea el estado en la única ruta permitida. Los espectadores nunca lo crean. El estado inicial permanece disponible para quienes entren después.

## Verificación real y comprobación del primer acceso

- Comprobar el UID real autorizado y el acceso con Google desde teléfono y computadora.
- Leer el estado público sin autenticación; intentar escribir sin autenticación y con otro UID debe producir `PERMISSION_DENIED`.
- Intentar leer `/privado/electrogestion/notas` y una nota concreta sin autenticación debe producir `PERMISSION_DENIED`. No comprobar la privacidad solo ocultando la interfaz.
- Abrir dos sesiones de navegador independientes contra el proyecto real. Avanzar, retroceder, zoom, entidad, relación, campo y visibilidades deben reflejarse sin recargar.
- Abrir un tercer espectador tarde y recargarlo; debe recuperar el estado global actual. Simular desconexión y reconexión. Los comandos no confirmados no deben quedar presentados como aplicados.
- Probar con el teléfono en datos móviles y el proyector/PC en otra red antes de considerar verificada la conexión entre redes.
- Revisar que no haya controles ni notas en el DOM público y que las notas no formen parte del objeto público de RTDB.
- Revisar inventario, reglas de la instancia real y `npm run verificar:publicacion`; entonces autorizar la publicación.

Además de las pruebas con emuladores, se verificó la sincronización de Firebase real con tres navegadores, el rechazo de escritura anónima, la privacidad de notas y las reglas por lectura administrativa. Los comandos de la prueba de nube fueron enviados por el cliente administrativo autorizado. El propietario confirmó manualmente el acceso con Google y un avance desde el control; Authentication registró el inicio de sesión con el UID autorizado. No se automatizó ese flujo interactivo ni se probó un teléfono físico en otra red. Ambos enlaces quedaron verificados en navegador después del despliegue correcto de GitHub Actions.

## Publicación

Se mantiene GitHub Pages. Las rutas finales serán:

- Control protegido por Authentication: `https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/control`
- Pantalla pública: `https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/presentacion`

La dirección de control no es un secreto: la seguridad la aplican Authentication y las reglas. Conocer ese enlace no concede control ni acceso a notas.

El workflow instala con Node 24, ejecuta pruebas del modelo y reglas en el emulador, valida la configuración web, compila y despliega los estáticos. No consulta MySQL ni despliega reglas o autoriza usuarios de Firebase automáticamente. La publicación se bloquea mientras la configuración web esté deshabilitada o incompleta.

## Si cambia el esquema MySQL

El extractor local existente se conserva. Regenerar `esquema_erd.json` cambia su hash. Preparar y verificar también la autorización de versión del modelo y la migración del **mismo** estado global antes de desplegar. No cambiar `/autorizacion/modelo` dejando una sesión de la versión anterior sin plan de migración. No reiniciar la revisión silenciosamente durante una exposición. Los espectadores con un modelo distinto muestran aviso y necesitan cargar la nueva compilación; nunca se mezclan estructuras.
