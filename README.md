# ElectroGestión · Aula del modelo relacional

Presentación interactiva en español del esquema real `electrogestion_db`. React, TypeScript, XYFlow, Motion y Tailwind; extractor local Node.js con mysql2 y servicio opcional Express. La publicación es estática y no necesita MySQL.

**Presentación pública:** https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/

Publicada y verificada en navegador el 27 de octubre de 2026: bienvenida, avance y retroceso, diagrama completo y adaptación móvil. No requiere MySQL ni servicios locales.

## Instalación

Requiere Node.js 22 o posterior y npm. Desde esta carpeta:

```sh
npm ci
npm run dev
```

Abre la dirección que imprime Vite. Para una compilación de producción:

En el equipo original también puedes ejecutar `powershell -ExecutionPolicy Bypass -File .\iniciar.ps1`: usa la instalación portátil preparada en AppData si Node no está en PATH.

```sh
npm test
npm run build
npm run preview
```

La ruta relativa de Vite permite servir la aplicación dentro de `/electrogestion-erd-presentacion/` en GitHub Pages. `public/esquema_erd.json` se copia a la compilación y es la única fuente de estructura para el navegador.

Para repetir la prueba completa en navegador, instala Chromium con `npx playwright install chromium`, ejecuta `npm run build` y mantén `npm run preview -- --base=/electrogestion-erd-presentacion/ --port=4173` activo en otra terminal. Después ejecuta `npm run test:navegador`. Recorre todas las etapas en ambos sentidos y valida el modelo final; las capturas quedan en `privado/`, excluido de Git. La prueba usa la compilación estática para evitar recargas de desarrollo mientras se editan otros archivos.

## Actualizar desde MySQL local

Copia `.env.example` a `.env` y configura una cuenta existente con acceso de lectura a los metadatos de `electrogestion_db`. No publiques `.env`. Después:

```sh
npm run actualizar-esquema
npm test
npm run build
```

El extractor consulta exclusivamente TABLES, COLUMNS, STATISTICS, KEY_COLUMN_USAGE y REFERENTIAL_CONSTRAINTS de INFORMATION_SCHEMA, con parámetros y sesión de transacciones de solo lectura. No consulta filas de negocio, no ejecuta los SQL originales y no modifica tablas ni usuarios. Cierra la conexión incluso ante errores.

Si no existe `MYSQL_USER`, permite reutilizar una conexión local explícita de `.vscode/settings.json`, limitada a localhost y a la base solicitada. En el entorno inicial esa cuenta es `root`: la sesión se limita a lectura, pero **sus privilegios de cuenta no son de solo lectura**. Para el uso habitual configura una cuenta restringida en `.env`; la aplicación no crea usuarios ni cambia permisos. Nunca se buscan contraseñas en almacenes protegidos.

`npm run servidor` ofrece opcionalmente `GET http://127.0.0.1:3001/api/esquema` para regenerar y consultar metadatos. Solo escucha en loopback; no se despliega y el frontend público no lo invoca.

## Cómo presentar

1. Pulsa **Iniciar presentación**. El lienzo empieza vacío.
2. Avanza con **Siguiente** o flecha derecha. Cada columna es una etapa; las FK aparecen cuando ambos extremos ya están visibles.
3. Usa flecha izquierda para volver al estado anterior. Espacio inicia o pausa el avance automático, cada 2,8 segundos. Los atajos no interfieren al escribir ni al usar botones.
4. El índice permite buscar una tabla y saltar a su aparición. **Diagrama completo** muestra el resultado final.
5. Las herramientas permiten ocultar columnas o relaciones y enfocar la entidad o relación actual. Los controles del lienzo ajustan zoom y encuadre; arrastra el fondo para desplazar y las entidades para ajustar posiciones.
6. Haz clic en una columna para consultar tipo, nulabilidad y claves. El panel lateral explica las FK y sus reglas ON DELETE / ON UPDATE.
7. El botón de ajustes del índice muestra flechas para cambiar el orden didáctico; ese orden y la visibilidad se guardan en localStorage. Cambiar el orden reinicia el recorrido sin modificar la base.
8. Usa el icono superior para pantalla completa. **Exportar** permite descargar la vista actual a PNG/SVG; **PDF / Imprimir** usa el diálogo del navegador. Para un PDF del conjunto, selecciona antes **Diagrama completo**. No genera un PDF de todas las etapas.

La distribución inicial usa Dagre y conectores smoothstep. Los ciclos y diagramas muy densos pueden requerir ajustes manuales; no se garantiza ausencia absoluta de cruces.

## Precisión del modelo

Solo se dibujan FK declaradas; los nombres parecidos no crean relaciones. La cardinalidad se expresa **destino → origen**: un índice único en las columnas de origen permite 1:1; en otro caso, un destino único permite 1:N. La nulabilidad indica si un registro de origen puede carecer de referencia. Un destino puede tener cero referencias. Si el índice de destino no garantiza unicidad, la cardinalidad queda no determinada. Las claves compuestas se conservan y sus pares de columnas se conectan por separado.

Una tabla que tiene varias FK no se etiqueta automáticamente N:M. El panel explica su papel de enlace sin atribuir una asociación no demostrada. Los ejemplos con el valor `7` están marcados como ilustrativos y no proceden de la base.

La asociación N:M de `producto` y `localizacion` mediante `inventario` se reconoce por sus dos FK 1:N obligatorias y el índice único compuesto `(id_producto, id_localizacion)`. Se conserva como explicación de la tabla intermedia, sin inventar una FK directa entre sus extremos.

El JSON contiene tablas, columnas, índices, FK, reglas referenciales, cardinalidades, descripciones, orden y etapas; no contiene valores por defecto de columnas, registros, secretos ni contadores AUTO_INCREMENT de tablas.

## Presentar sin MySQL

El JSON ya generado permite desarrollar, compilar y presentar con MySQL apagado. GitHub Pages solo sirve archivos estáticos. Para presentar sin Internet en otro equipo, lleva `dist/` y sírvelo mediante un servidor HTTP local; abrir `index.html` por `file://` no es compatible con módulos y fetch. No hay caché PWA ni garantía de uso sin red del sitio público.

## GitHub Pages

El propietario aprobó el inventario y la publicación en el repositorio existente `castilloleongustavo-eng/electrogestion-erd-presentacion` el 27 de octubre de 2026.

Pages está configurado con **Settings → Pages → Source → GitHub Actions**. El flujo `.github/workflows/publicar.yml` instala con npm ci, verifica el modelo, compila y despliega `dist/` cuando se actualiza `main`. No consulta MySQL ni requiere secretos de base de datos. Para actualizar, regenera el esquema localmente, verifica y sube los cambios al repositorio.

URL publicada y verificada:

`https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/`

## Estructura

- `src/main.tsx`: interfaz, controles, tarjetas y panel educativo.
- `src/modelos/presentacion.mjs`: orden, validación y generación pura de etapas.
- `src/estilos.css`: tema, adaptación móvil, impresión y accesibilidad visual.
- `servidor/metadatos.mjs`: conexión y consultas de metadatos.
- `servidor/actualizar-esquema.mjs`: regeneración de la copia estática.
- `servidor/index.mjs`: API local opcional.
- `public/esquema_erd.json`: estructura real para el modo independiente.
- `pruebas/`: verificación de integridad, recorrido y navegación.

Los SQL originales y `.vscode/` permanecen locales y excluidos por `.gitignore`.
