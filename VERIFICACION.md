# Verificación local · 27 de octubre de 2026

- Extracción correcta de la base activa: 23 tablas, 174 columnas, 30 claves foráneas declaradas y 259 etapas. Consultas exclusivamente a INFORMATION_SCHEMA, en sesión de lectura; sin ejecución de los SQL originales.
- La captura SQL local contiene también 30 restricciones FK. La lista y los campos están documentados en ANALISIS_ESQUEMA.md.
- `npm test`: cinco pruebas aprobadas para integridad de las relaciones, totalidad del recorrido, restauración de estados, orden manual y ausencia de campos de secretos/registros en el JSON.
- `npm run build`: TypeScript y compilación Vite aprobados. Vite avisa de un paquete JavaScript mayor de 500 kB (aproximadamente 202 kB comprimido); no impide compilar.
- Chromium / Playwright sobre la compilación estática: recorrido de las 259 etapas hacia adelante y hacia atrás, comprobando en cada estado las tablas y columnas visibles. Al finalizar aparecen las 23 entidades, 174 columnas y 30 conexiones. Sin excepciones de JavaScript en ese recorrido.
- Pruebas de controles en Chromium: detalle de columna, mostrar/ocultar atributos, flecha de teclado, exportaciones descargadas PNG y SVG, modo enfoque y entrada a pantalla completa.
- Capturas revisadas de bienvenida en escritorio y móvil; comprobación automática de ausencia de desbordamiento horizontal en móvil de 390 px. Las capturas y exportaciones permanecen en privado/, excluido de Git.
- Compilación servida bajo `/electrogestion-erd-presentacion/`: carga correctamente el JSON estático. No se observaron peticiones al servicio local de metadatos, puerto MySQL ni rutas /api/.
- Revisión de los archivos preparados: excluidos SQL originales, configuración del editor, .env privados, dependencias y capturas. Sin coincidencias de patrones de tokens GitHub, claves privadas o URI MySQL con contraseña. La plantilla .env.example no contiene secretos.

## Límites y publicación verificada

La cuenta local disponible es root; la sesión de extracción se limitó a lectura, pero no se modificaron sus privilegios. Se recomienda configurar una cuenta restringida existente mediante .env para futuras actualizaciones. No se accedió al almacén protegido ni al ERD visual de DBeaver.

La exportación PDF usa el diálogo de impresión del navegador y representa la vista elegida, no toda la secuencia de diapositivas. La exportación PNG/SVG captura la vista actual. La distribución automática puede requerir ajustes manuales para diagramas densos.

El propietario aprobó la publicación del inventario y seleccionó el repositorio existente castilloleongustavo-eng/electrogestion-erd-presentacion el 27 de octubre de 2026. Se conserva su commit inicial. La subida utilizó el conector GitHub autenticado, sin depender de credenciales de CLI. El propietario habilitó GitHub Pages con GitHub Actions.

El flujo https://github.com/castilloleongustavo-eng/electrogestion-erd-presentacion/actions/runs/40585430505 terminó correctamente en su segundo intento: instalación, cinco pruebas, compilación y despliegue aprobados. El primer intento se había detenido porque Pages no estaba habilitado.

La URL https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/ devuelve HTTP 200. Se verificó con Chromium sobre Internet: recursos sin errores HTTP, ausencia de excepciones JavaScript, bienvenida, lienzo vacío, avance, retroceso, 23 entidades, 174 columnas, 30 relaciones, adaptación móvil de 390 px y ausencia de peticiones a localhost, 127.0.0.1 o puertos locales de MySQL/backend. El código desplegado corresponde al commit 8e82d2be5c6c261169265dbe637d57c59136c925. Las capturas de verificación permanecen excluidas en privado/.
