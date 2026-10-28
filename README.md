# ElectroGestión · Presentación ERD en vivo

Una sola aplicación React, un repositorio, dos enlaces y la única sesión global `electrogestion`.

- **Pantalla pública:** `#/presentacion` muestra exclusivamente el ERD y las explicaciones activadas. No contiene botones, menús, edición, notas ni controles de zoom.
- **Control del presentador:** `#/control` requiere Firebase Authentication y autorización del UID en las reglas. Incluye navegación, reproducción, zoom proporcional, enfoque, entidades, campos, relaciones, columnas, animaciones, explicaciones, notas privadas y exportación de la vista.

**Estado del rediseño:** Firebase real electrogestion-erd está configurado, con Google Authentication, UID exclusivo del propietario, reglas instaladas y verificadas y la única sesión electrogestion inicializada. La sincronización y privacidad pasaron pruebas con tres navegadores contra la nube. Ambas rutas están publicadas y verificadas en GitHub Pages. El propietario confirmó el acceso con Google y el avance desde el control; Firebase registró ese inicio de sesión con el UID autorizado. La prueba interactiva del propietario fue manual, mientras que las pruebas de sincronización y privacidad se ejecutaron también automáticamente.

## Instalación y compilación

Requiere Node.js 24.12 o posterior. Para las pruebas Firebase se necesita Java 21 o posterior; localmente se comprobó con Java 26. No requiere MySQL para compilar.

```sh
npm ci
npm test
npm run build
```

`npm run dev` abre el servidor local. Sin configuración Firebase real, la aplicación informa que la emisión no está configurada: no simula una presentación independiente ni abre una sesión insegura. En el equipo original `powershell -ExecutionPolicy Bypass -File .\iniciar.ps1` también encuentra la instalación portátil de Node 24.

La configuración de Firebase, las autorizaciones necesarias, el inventario y la comprobación real antes de publicar están en [PUESTA_EN_MARCHA_FIREBASE.md](PUESTA_EN_MARCHA_FIREBASE.md). La cuenta autorizada y las reglas ya están configuradas en el proyecto electrogestion-erd.

## Arquitectura

```text
src/
  paginas/control/           Panel responsive con acceso autenticado
  paginas/presentacion/      Pantalla pública sin herramientas
  componentes/diagrama/      Lienzo, cámara proporcional y explicaciones compartidas
  componentes/animaciones/   Tarjetas y columnas del ERD existente
  componentes/controles/     Notas privadas del presentador
  servicios/autenticacion/  Google sign-in y verificación de UID
  servicios/sincronizacion/ Firebase y suscripción a la única sesión
  modelos/                  Esquema, secuencia original y acciones del estado
  datos/                    Identidad verificable del esquema
  estilos/                  Interfaz del control y pantalla de proyección
firebase/                   Reglas RTDB con denegación por defecto
scripts/                    Preparación local y validación para publicación
servidor/                   Extractor MySQL y API local originales
public/esquema_erd.json      Metadatos reales, sin registros
```

Se conserva el generador de 259 etapas y el esquema de 23 tablas, 174 columnas y 30 FK declaradas. El lienzo compartido reutiliza XYFlow, Dagre y Motion; el modelo y las explicaciones no se duplican entre interfaces.

## Estado global y reconexión

El estado público reside exclusivamente en `sesiones/electrogestion/publico`. Las notas usan `privado/electrogestion/notas/{etapa}` y nunca forman parte del estado público. No se concede lectura del árbol completo.

Cada comando usa una transacción con revisión esperada e incremento de uno, sin mostrar eventos optimistas como confirmados. Si otro control del mismo propietario avanzó, el comando antiguo se aborta. Los clientes ignoran revisiones anteriores. Las reglas validan campos, rangos, modelo y vencimiento de comandos; los botones quedan bloqueados sin conexión.

La reproducción comparte un paso de origen y la hora de servidor. Cada pantalla calcula la etapa actual usando el desfase del reloj de Firebase, incluida la incorporación tardía. El reloj continúa aunque el control se cierre. Los cambios visuales conservan la reproducción; navegar manualmente o pausar la detiene. No se escribe una nueva etapa por cada espectador.

La cámara transmite centro normalizado y un factor de zoom sobre el encuadre de cada pantalla. En el control, los botones flotantes +, −, mano y centrar están sobre el lienzo. La mano permite arrastrar con mouse o tacto; la rueda y el pellizco ajustan el zoom. Los movimientos se agrupan cada 200 ms, con una sola petición en curso y confirmación del punto final. La navegación espera al cierre del gesto para evitar carreras entre el último movimiento y una orden de centrado o de etapa. Nunca transmite dimensiones de teléfono como si fueran dimensiones del proyector. Seleccionar una entidad o una relación centra el mismo contenido en todas las pantallas. Las posiciones del modelo permanecen constantes al revelar columnas.

La reconexión recupera el último estado del servidor. Mientras una pantalla está desconectada no puede recibir órdenes nuevas; al regresar se alinea de nuevo. No se promete latencia cero ni control con Internet caído.

## Uso del presentador

1. Abrir `#/control` e iniciar sesión con Google. Si Firebase reconoce la cuenta pero el UID no coincide con el autorizado, el control sigue bloqueado y no se consultan notas.
2. Inicializar la única sesión si aún no tiene estado. Abrir `#/presentacion` en el proyector y compartir ese enlace con el público.
3. Usar Siguiente, Anterior, selector de etapas, reproducción, pausa y reinicio. Flechas y espacio también funcionan fuera de campos y botones.
4. Buscar y enfocar una entidad; elegir una relación o campo para resaltarlo globalmente. Ajustar zoom o centro según la composición.
5. Activar columnas, relaciones, claves, enfoque, animaciones, explicaciones o indicador. Todos los espectadores reciben la misma configuración.
6. Leer el contexto privado situado entre el diagrama y la navegación: número y nombre de etapa, descripción, objetivo y tablas/campos/relaciones reales. Cambia con la etapa; no se envía a la pantalla pública. La explicación técnica y el ejemplo siguen disponibles en el detalle desplegable.
7. Escribir notas por etapa y guardarlas expresamente. El aviso indica si quedan cambios sin guardar. Cambiar de etapa sin guardarlas descarta el borrador local.
8. Exportar PNG/SVG captura únicamente el diagrama de la vista previa; no captura las notas ni el resto del panel. El modo pantalla completa del control afecta al dispositivo del presentador. El navegador del proyector ocupa su viewport y puede ponerse en pantalla completa con la función del propio navegador.

Las credenciales de Google no se almacenan en el código. El acceso de pruebas con correo/contraseña está limitado a una compilación especial, dominio loopback y proyecto demo, y autentica contra el emulador. No es un acceso alternativo en producción.

## Pruebas reproducibles

```sh
npm test
npm run test:reglas
npm run build:pruebas
npm run test:sincronizacion
npm run build
```

La prueba de reglas usa la base emulada y usuarios anónimos, propietario y otra cuenta. La de sincronización levanta su servidor de la compilación de pruebas y abre tres contextos de navegador aislados: control móvil, espectador y entrada tardía. Prueba cambios por RTDB, privacidad real por HTTP, acceso, navegación, zoom, selección, recarga, reconexión, reproducción y ausencia de controles en el DOM público. Los emuladores se cierran al terminar. Las capturas y registros se guardan en `privado/`, ignorado por Git.

Instalar Chromium una vez con `npx playwright install chromium` si no está disponible. Las pruebas no crean servicios externos ni sesiones de exposición adicionales: usan la misma ruta `electrogestion` en un entorno demo local. No sustituyen la comprobación en el Firebase real y en redes diferentes antes del despliegue.

## Esquema MySQL conservado

`servidor/metadatos.mjs`, el comando `npm run actualizar-esquema` y la API opcional `npm run servidor` siguen siendo herramientas exclusivamente locales. No se ejecutaron consultas MySQL ni se modificó la base durante este rediseño. El esquema conserva su hash SHA-256 original `17f5c49b36680f3bf9e27847c753a222a97e1a16038ef349e9d7b7e5cfaee856`.

Para futuras extracciones, configurar una cuenta existente de lectura en `.env`, sin publicarlo. Si no existe MYSQL_USER, el extractor puede reutilizar la conexión explícita local de SQLTools. La cuenta del entorno inicial es root; limitar la sesión a lectura no cambia sus privilegios. No se descifran almacenes de DBeaver.

Después de regenerar el esquema, ejecutar `node scripts/preparar-modelo.mjs`, revisar el cambio de versión y preparar una migración de la misma sesión Firebase antes de publicar. GitHub Pages y GitHub Actions nunca se conectan a MySQL.
## Enlaces de la aplicación

- **Control protegido:** https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/control
- **Presentación pública:** https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/#/presentacion

La ruta de control muestra el acceso con Google hasta que se autentique el UID autorizado. Conocer el enlace no concede acceso. La presentación pública no requiere iniciar sesión y recupera automáticamente la etapa actual de la única sesión global.
