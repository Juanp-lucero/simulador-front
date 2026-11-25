# AeroMind IA · Frontend

Angular 21, TypeScript, Tailwind CSS, Leaflet y Chart.js. Repositorio independiente del backend FastAPI (`Juanp-lucero/simulador-back`).

## Despliegue

Desplegado en Vercel:

| | URL | Repositorio |
|---|---|---|
| Aplicación (frontend) | https://simulador-front.vercel.app | [Juanp-lucero/simulador-front](https://github.com/Juanp-lucero/simulador-front) |
| API (backend) | https://simulador-back.vercel.app | [Juanp-lucero/simulador-back](https://github.com/Juanp-lucero/simulador-back) |
| Estado de la API | https://simulador-back.vercel.app/health | |
| Documentación de la API | https://simulador-back.vercel.app/docs | |

## Cuenta de prueba

Para revisar AeroMind IA sin registrarse:

| Aplicación | Correo | Contraseña |
|---|---|---|
| https://simulador-front.vercel.app | `profesor.demo@example.com` | `ProfeDemo2026*` |

Es una cuenta de demostración creada solo para la evaluación; no contiene datos personales.

## Cómo probarlo

1. Entra a https://simulador-front.vercel.app e inicia sesión con la [cuenta de prueba](#cuenta-de-prueba) (o crea una cuenta en **Crear cuenta**). Abajo a la izquierda debe decir **API conectada** y **Asistencia IA activa (Groq)**.
2. **Aeronaves → nueva aeronave:** matrícula `HK-5001`, modelo `Cessna 172`, velocidad de crucero `60` m/s, altitud máxima `4200` m.
3. **Planes de ruta → nuevo plan:** nombre `Bogotá — Medellín`, aeronave `HK-5001` y estos waypoints (los valores grises son solo ejemplos; hay que escribirlos):

   | # | Latitud | Longitud | Altitud (m) | Velocidad (m/s) |
   |---|---|---|---|---|
   | 1 | 4.7016 | -74.1469 | 2600 | 60 |
   | 2 | 5.5 | -74.8 | 4100 | 60 |
   | 3 | 6.1714 | -75.4231 | 2100 | 55 |

4. En la ruta, pulsa **Métricas**: distancia, duración estimada, altitudes, velocidades y margen bajo el techo. Esta ruta muestra una alerta porque el waypoint 2 pasa a 100 m del techo de la aeronave.
5. Pulsa **Revisar con IA**: resumen, fortalezas, riesgos y sugerencias. La etiqueta **IA** indica que respondió Groq; **REGLAS** indica que se usó el respaldo automático.
6. **Simulador:** marca la ruta, **Cargar escenario**, reproduce o mueve la línea de tiempo y pulsa **Explicar con IA**. Escribe un nombre y pulsa **Guardar**.
7. **Historial:** abre la simulación guardada. Puedes explicarla con IA (la explicación queda guardada), renombrarla, eliminarla o **Abrir en el simulador** en el mismo segundo.
8. **Resumen:** totales de aeronaves, rutas, simulaciones guardadas, simulaciones explicadas con IA y distancia planificada.

## Cómo funciona

```
Angular + Leaflet + Chart.js (Vercel) ──REST + JWT──▶ FastAPI (Vercel) ──▶ PostgreSQL (Neon)
                                                          │
                                                          └──▶ Groq (IA, opcional)
```

1. **Motor de simulación (determinístico):** calcula la posición, altitud, velocidad, rumbo y progreso de cada aeronave en un instante, con geometría sobre la esfera terrestre. Es un modelo académico: no incluye viento, aceleración ni separación entre aeronaves.
2. **Métricas de ruta:** el backend calcula distancia, duración, rangos de altitud y velocidad, margen bajo el techo y tasa vertical. Genera alertas cuando:
   - la ruta no tiene aeronave;
   - supera el techo o queda a menos de 150 m de él;
   - va a más de 1,2 veces la velocidad de crucero;
   - sube o baja a más de 10 m/s.
3. **IA (Groq, `openai/gpt-oss-120b`):** solo interpreta. Recibe los números ya calculados y nunca los cambia.
   - **Explicar:** lectura en lenguaje natural de un instante de la simulación.
   - **Revisar ruta:** JSON validado con resumen, fortalezas, riesgos y sugerencias. Si la IA falla, responde con una revisión por reglas.
   - Si el modelo configurado deja de existir, el backend prueba otro automáticamente.
4. **Historial:** cada simulación guardada conserva sus rutas, el instante, el resultado calculado y, si se pidió, la explicación de la IA.

## Funciones implementadas

- Registro/login contra `/auth/register`, `/auth/login` y `/auth/me`.
- JWT solo en memoria; se elimina al salir o recibir un `401`. No se envía a otros dominios y no se guarda en localStorage.
- Crear, editar y eliminar aeronaves propias.
- Crear, editar y eliminar rutas de 2–100 waypoints; asignar una aeronave propia.
- Mapa de rutas y posiciones, telemetría y gráfica de altitudes calculadas.
- Preview HTTP con reproducción, pausa, reinicio, velocidad de tiempo simulado y búsqueda de un instante.
- Manejo de errores y estados vacíos; no hay registros simulados incrustados en la interfaz.
- Historial de simulaciones: guardar un instante desde el simulador, listar con paginación, renombrar, eliminar y reabrirlo en el simulador (`/simulation?routes=1,2&t=30`).
- Resumen con totales de `/stats`, simulaciones recientes y aviso de rutas sin aeronave.
- Métricas de cada plan de ruta (`/routes/{id}/insights`): distancia, duración, altitudes, velocidades, margen bajo el techo y alertas.
- Estado de la API y de la IA en la barra lateral (`/health/details`).

## Asistencia IA

La IA (Groq, en el backend) interpreta resultados; nunca cambia los cálculos del motor.

| Dónde | Qué hace | Endpoint |
|---|---|---|
| Simulador | "Explicar con IA" el instante actual | `POST /ai/simulation/explain` |
| Historial | Explicar una simulación guardada; la explicación se guarda con ella | `POST /ai/simulation/runs/{id}/explain` |
| Planes de ruta | "Revisar con IA": resumen, fortalezas, riesgos y sugerencias | `POST /ai/routes/{id}/review` |

- Si el servidor no tiene `GROQ_API_KEY`, la interfaz lo indica (`503`) y todo lo demás sigue funcionando.
- La revisión de rutas nunca falla por la IA: sin proveedor, el backend responde con una revisión por reglas y la interfaz la marca como **REGLAS**.
- Las respuestas se muestran como texto (títulos, viñetas y párrafos), nunca como HTML.

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

Las pruebas unitarias (Vitest + jsdom) cubren los contratos de la API, los mensajes de error, los formateadores, el texto de la IA y las páginas de resumen, simulador, planes de ruta e historial con `HttpTestingController`; no llaman a la API real ni a Groq.

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
