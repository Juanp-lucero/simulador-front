# AeroMind IA · Frontend

Angular 21, TypeScript, Tailwind CSS, Leaflet y Chart.js. Repositorio independiente del backend FastAPI (`Juanp-lucero/simulador-back`).

## Funciones implementadas

- Registro/login contra `/auth/register`, `/auth/login` y `/auth/me`.
- JWT solo en memoria; se elimina al salir o recibir un `401`. No se envía a otros dominios y no se guarda en localStorage.
- Resumen con conteos obtenidos de la API.
- Crear, editar y eliminar aeronaves propias.
- Crear, editar y eliminar rutas de 2–100 waypoints; asignar una aeronave propia.
- Mapa de rutas y posiciones, telemetría y gráfica de altitudes calculadas.
- Preview HTTP con reproducción, pausa, reinicio, velocidad de tiempo simulado y búsqueda de un instante.
- Manejo de errores y estados vacíos; no hay registros simulados incrustados en la interfaz.

## Desarrollo

Requiere Node 22.18+ o Node 24+ y npm. Desde este repositorio:

```bash
npm ci
npm start
```

Abre `http://localhost:4200`. El backend debe estar ejecutándose y permitir ese origen en `CORS_ORIGINS`.

`public/config.json` define la URL de la API. El valor local es `http://127.0.0.1:8000`. Es configuración pública, **no un lugar para claves ni contraseñas**. No debe apuntar a localhost cuando publiques la aplicación; utiliza la URL HTTPS real del backend.

La sesión termina al recargar porque el JWT se mantiene en memoria. Todavía no hay refresh tokens ni sesión por cookie.

## Verificación

```bash
npm test
npm run build
```

En entornos con poca memoria:

```bash
NG_BUILD_MAX_WORKERS=1 NODE_OPTIONS=--max-old-space-size=512 npm run build
```

El bundle de producción queda en `dist/aeromind-front/browser`. El servidor estático de producción debe redirigir rutas desconocidas a `index.html`; `/config.json` debe ser accesible y no quedar congelado en caché.

### Flujo real en navegador

La prueba crea una cuenta, una aeronave y una ruta; no la ejecutes contra una base de producción. Inicia frontend y backend con una base desechable y luego:

```bash
npx playwright install chromium
E2E_ALLOW_DATA_CREATION=1 npm run test:e2e
```

Comprueba registro, login, creación de aeronave, creación/edición de ruta, marcadores del mapa, búsqueda de tiempo y reproducción. Las teselas externas de OpenStreetMap se bloquean en la prueba para que la verificación de la API no dependa de esa red. La imagen de fondo externa no forma parte de esta prueba.

`E2E_FRONTEND_URL` permite cambiar el origen del frontend. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` y `PLAYWRIGHT_BROWSER_LIBS` son opciones para entornos Nix; normalmente no se necesitan. `PLAYWRIGHT_LOW_MEMORY=1` reduce procesos de Chromium para pruebas locales. También existe `npm run test:e2e:runner`, que usa el runner estándar de Playwright y puede iniciar `ng serve`.

`docs/ci/verify.yml` contiene una plantilla para ejecutar pruebas unitarias, build de producción y el flujo de navegador con PostgreSQL temporal y el backend público separado. **No está activada**: GitHub permitió publicar los archivos del proyecto, pero rechazó publicar el workflow en `.github/workflows/`. Para activarla, cópiala a `.github/workflows/verify.yml` con una cuenta/conexión autorizada para modificar workflows.

La prueba completa local se verificó una vez; las repeticiones en el entorno Nix de desarrollo tuvieron timeouts intermitentes. La repetibilidad del navegador y la ejecución de CI siguen pendientes.

## Límites actuales

- Uso exclusivamente académico. No usar para navegación ni control de tráfico aéreo real.
- La línea del mapa conecta los waypoints; las posiciones son calculadas por el motor geodésico del backend.
- Velocidad en m/s, altitud en metros, coordenadas en grados.
- Las vistas cargan hasta 100 aeronaves y 100 rutas. Cada preview admite hasta 25 rutas.
- La reproducción solicita snapshots HTTP; no es todavía un canal WebSocket ni una sesión compartida/persistente.
- Conflictos, predicción, optimización e IA todavía no se presentan como funciones terminadas.
- OpenStreetMap recibe las solicitudes de teselas del navegador; conserva su atribución y respeta sus políticas de uso.
