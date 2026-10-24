# TrimmOS V2 — The Next Era

Landing estática e independiente de TrimmOS, desarrollada por Hesed Core.

## Entorno

Node.js >=22.23.4 (validado con 24.22.0) y npm >=9.6.5. TypeScript 6 se mantiene por compatibilidad declarada de Astro Check; TypeScript 7 todavía queda fuera de su rango de peers.

```sh
npm ci
npm run dev
npm run check
npm run build
npm run verify
npm run preview
npm audit --audit-level=low
```

Estos comandos usan exclusivamente los recursos anonimizados versionados en
`public-safe/`. No necesitan las capturas originales ni `auditoria-trimmos.json`.

En Windows puede usarse `npm.cmd` si PowerShell bloquea `npm.ps1`. En entornos con CA corporativa, Node puede usar `--use-system-ca`; nunca desactivar TLS. Una caché temporal de npm evita escribir fuera del área permitida.

## Arquitectura

- `src/data/site.ts`: WhatsApp oficial y mensajes por acción.
- `src/data/showcase.ts`: manifiesto tipado y contenido único del Product Theater.
- `src/data/assets.generated.json`: dimensiones, máscaras públicas y disponibilidad de recursos procesados.
- `src/components/Gallery.astro`: filtros, miniaturas, navegación, gestos y diálogo nativo.
- `src/styles/global.css`: sistema visual editorial independiente, sin dependencias CSS externas.
- `scripts/prepare-assets.mjs`: pipeline privado, sólo bajo autorización, para regenerar recursos públicos desde las fuentes locales.
- `scripts/verify-private-assets.mjs`: comprueba los hashes de las fuentes privadas.
- `scripts/verify-output.mjs`: verificación pública de enlaces, precios, los 22 recursos y las máscaras anonimizadas.

## Privacidad de imágenes

`public/` conserva los recursos originales, pero **no es el publicDir de Astro**.
Sólo `public-safe/` se sirve y se copia a `dist/`. No cambiar esta separación.
No servir la raíz del repositorio ni desplegar `public/`.
Los originales contienen información identificativa y requieren control de acceso en cualquier entrega de código.

Agregar una captura exige inspección individual, tratamiento irreversible de datos privados y registro en el manifiesto; no basta con poner el PNG en una carpeta. Las categorías sólo aparecen cuando hay recursos disponibles. Ninguna imagen se reproduce automáticamente.

Las once capturas actuales tienen máscaras autorizadas en `scripts/privacy-regions.json`, vinculadas a dimensiones y hashes SHA-256. El build y `npm run verify` no ejecutan el pipeline privado y no leen las capturas originales ni `auditoria-trimmos.json`; consumen los 22 WebP anonimizados versionados en `public-safe/showcase/`.

La regeneración se limita a un entorno autorizado con los PNG originales y el manifiesto privado `scripts/privacy-regions.json`; este manifiesto está ignorado por Git y no se entrega. Ejecutar explícitamente `npm run assets:private`; el script verifica hash y dimensiones, aplica las máscaras opacas, aplana y elimina metadatos, genera masters y miniaturas y actualiza el manifiesto público `src/data/assets.generated.json`, que contiene sólo dimensiones y coordenadas de máscara, nunca hashes de originales. Después se puede ejecutar `npm run verify:private` para confirmar que las fuentes originales no cambiaron. No añadir fuentes ni el manifiesto privado a Git, no actualizar un hash sin revisar individualmente la captura y las coordenadas, y revisar visualmente los derivados antes de aprobarlos. Los derivados aprobados se incorporan a `public-safe/` junto con el manifiesto público. La verificación pública comprueba todas las máscaras de los masters y que el interior enmascarado siga visible en las miniaturas, sin acceder a las fuentes privadas ni a la auditoría local.

La prueba opcional de lógica DOM se ejecuta con `node scripts/test-interactions.mjs <ruta-a-jsdom/lib/api.js>`, usando una instalación temporal de jsdom. No añade dependencias al sitio. Simula el diálogo y no sustituye pruebas de navegador, lector de pantalla ni responsive visual.

## Configuración comercial

30 días gratis; Essential $399 MXN/mes, una sucursal Barber o Beauty; Pro $599 MXN/mes, Barber + Beauty; sucursal adicional desde $100 MXN, sujeta a condiciones vigentes.
Los CTA abren WhatsApp; no crean cuentas ni activan pagos. Número único: +52 81 3573 1273.

## Despliegue futuro (no autorizado en esta entrega)

Ejecutar `npm ci`, `npm run check`, `npm run build` y `npm run verify`.
Publicar exclusivamente `dist/` después de revisión humana.
Canonical: https://www.trimmos.com/.
Vercel Analytics se incluye una sola vez cuando `VERCEL=1` en compilación.
No hay SSR, adaptador de servidor, endpoints, formularios ni secretos.

El requisito mínimo de Node debe coincidir con el entorno de build del proveedor antes de publicar. No se han cambiado variables ni configuración de producción.
