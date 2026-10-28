# Inventario del rediseño en vivo para aprobación

Estado: proyecto electrogestion-erd confirmado por el propietario, con configuración web proporcionada y solicitud de terminar la integración. Firebase real ya está configurado: reglas leídas y verificadas, UID exclusivo del propietario y sincronización de la sesión comprobada con tres navegadores. El propietario indicó continuar con la publicación y entregar los dos enlaces. Ambas rutas fueron publicadas y verificadas; el propietario confirmó el inicio con Google y el avance desde el control, y Firebase registró su acceso web.

Destino: el mismo repositorio público castilloleongustavo-eng/electrogestion-erd-presentacion y las rutas #/control y #/presentacion de una sola aplicación. Única sesión global electrogestion.

## Archivos incluidos

- .env.example
- .github/workflows/publicar.yml
- .gitignore
- ANALISIS_ESQUEMA.md
- firebase.json
- firebase/database.rules.json
- index.html
- iniciar.ps1
- INVENTARIO_PUBLICACION.md
- package.json
- package-lock.json
- pruebas/estado.test.mjs
- pruebas/contexto.test.mjs
- pruebas/firebase.reglas.mjs
- pruebas/modelo.test.mjs
- pruebas/sincronizacion.navegador.mjs
- public/esquema_erd.json
- public/firebase-config.json
- PUESTA_EN_MARCHA_FIREBASE.md
- README.md
- scripts/preparar-autorizacion.mjs
- scripts/preparar-modelo.mjs
- scripts/verificar-configuracion.mjs
- servidor/actualizar-esquema.mjs
- servidor/index.mjs
- servidor/metadatos.mjs
- src/componentes/animaciones/Entidad.tsx
- src/componentes/controles/Notas.tsx
- src/componentes/controles/ContextoEtapa.tsx
- src/componentes/controles/ControlesVista.tsx
- src/componentes/diagrama/Diagrama.tsx
- src/componentes/diagrama/Explicacion.tsx
- src/componentes/diagrama/geometria.mjs
- src/datos/modelo.json
- src/estilos.css
- src/estilos/vivo.css
- src/main.tsx
- src/modelos/esquema.ts
- src/modelos/contexto.mjs
- src/modelos/estado.mjs
- src/modelos/estado.ts
- src/modelos/presentacion.mjs
- src/paginas/control/Control.tsx
- src/paginas/presentacion/Presentacion.tsx
- src/servicios/autenticacion/usePresentador.ts
- src/servicios/sincronizacion/firebase.ts
- src/servicios/sincronizacion/useSesion.ts
- src/servicios/sincronizacion/useCamaraCompartida.ts
- src/vite-env.d.ts
- tsconfig.json
- VERIFICACION.md
- vite.config.ts

## Información que se hará pública

Código de las dos interfaces, reglas Firebase, pruebas, documentación y metadatos del mismo esquema ya aprobado. La configuración web incluye exclusivamente los identificadores Firebase proporcionados por el propietario para electrogestion-erd, cuya exposición al navegador es necesaria. La seguridad se aplica en Authentication y reglas, no ocultando ese archivo. El estado público incluye etapa, opciones, selección, cámara, reloj/revisión y UID técnico de quien confirmó el cambio.

El formulario de acceso al emulador solo puede funcionar en compilación de pruebas, loopback y proyecto demo. Sus contraseñas temporales se generan aleatoriamente durante la prueba y no están incluidas en el código. No existe contraseña fija del presentador.

## Exclusiones

No se suben notas privadas, borradores, credenciales o configuración administrativa Firebase, archivos de cuentas de servicio, tokens, .env privados, .firebaserc, .vscode/, SQL originales de electrogestion_db/, node_modules/, dist/, dist-pruebas/, logs, capturas ni privado/.

Las notas reales se alojarán en privado/electrogestion/notas dentro de RTDB, con lectura y escritura exclusiva del UID autorizado. Nunca se incorporan a archivos estáticos ni al estado público.

## Servicios configurados y mantenimiento

No se crea un repositorio ni una segunda sesión. El Firebase real electrogestion-erd quedó configurado con el único UID autorizado y las reglas verificadas. En futuras modificaciones deben conservarse reglas y datos ajenos a esta aplicación. Se probaron sesiones de navegador independientes contra la nube; no se probó directamente un teléfono físico en otra red. Ver PUESTA_EN_MARCHA_FIREBASE.md y VERIFICACION.md.

La actualización del panel añade controles flotantes, cámara compartida con coordenadas normalizadas y contexto privado de la etapa. No cambia las reglas, la autenticación, el esquema ni las etapas. Se verificaron mouse y gestos táctiles emulados en navegadores independientes.

Total de archivos preparados: 52.

El ajuste de duración del acceso cambia únicamente la persistencia del cliente Firebase a local, sus pruebas y documentación. No incorpora tokens ni perfiles de navegador; el perfil temporal de la prueba se guarda en privado/ y se elimina al finalizar.
