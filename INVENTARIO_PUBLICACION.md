# Inventario para aprobación de publicación

Destino propuesto: repositorio público castilloleongustavo-eng/electrogestion-erd-presentacion y GitHub Pages.

La publicación de este inventario fue aprobada expresamente por el propietario el 27 de octubre de 2026, quien indicó utilizar el repositorio existente castilloleongustavo-eng/electrogestion-erd-presentacion.

## Archivos incluidos

- .env.example
- .github/workflows/publicar.yml
- .gitignore
- ANALISIS_ESQUEMA.md
- index.html
- iniciar.ps1
- INVENTARIO_PUBLICACION.md
- package.json
- package-lock.json
- pruebas/modelo.test.mjs
- pruebas/navegador.mjs
- public/esquema_erd.json
- README.md
- servidor/actualizar-esquema.mjs
- servidor/index.mjs
- servidor/metadatos.mjs
- src/estilos.css
- src/main.tsx
- src/modelos/presentacion.mjs
- src/vite-env.d.ts
- tsconfig.json
- VERIFICACION.md
- vite.config.ts

## Contenido del esquema

public/esquema_erd.json contiene nombres de las 23 tablas reales, 174 columnas con tipos y nulabilidad, índices, 30 FK, reglas referenciales, cardinalidades verificadas, una asociación N:M respaldada por inventario, explicaciones ilustrativas y 259 etapas. Publicarlo hará visible esta estructura. No contiene filas de negocio ni credenciales.

## Exclusiones

No se subirán .vscode/, electrogestion_db/ (SQL originales), .env ni variantes privadas, node_modules/, dist/, privado/ (capturas), registros de ejecución ni configuraciones de DBeaver. .env.example es una plantilla sin contraseñas.

## Despliegue

GitHub Actions compilará el JSON estático con npm ci, npm test y npm run build. No conectará a MySQL. GitHub CLI requiere iniciar sesión antes de crear el repositorio.

URL prevista, todavía no publicada: https://castilloleongustavo-eng.github.io/electrogestion-erd-presentacion/
