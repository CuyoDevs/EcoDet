# QA · HU-15 Ver las alertas de un inmueble (DET-23, DET-91, DET-96 a DET-99)

> **Quién prueba:** alguien que **no** escribió el código de HU-15.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura necesita dos inmuebles: `Casa Norte` (con 6 lecturas estables de Luz + 1 lectura anómala que dispare alerta) y `Depto Sur` (**sin alertas**). Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** el contador de alertas pendientes en cada tarjeta del panel **Mis inmuebles** (W2) y la vista de alertas del inmueble (`#/inmuebles/{id}/alertas`, vista W5). Los endpoints `GET /api/inmuebles/{id}/alertas` y `GET /api/alertas/{id}` se pueden inspeccionar en `http://localhost:8000/docs`.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no incluye:** confirmar o marcar una alerta como consumo normal desde la UI corresponde a HU-16.

## Criterios de aceptación (HU-15)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Listado y detalle de alertas.** Con alertas generadas, veo el listado con servicio, período, tipo, desvío y estado, y al seleccionar una veo su detalle y el gráfico del período. | 1. En `Casa Norte` (con una alerta generada en Luz), verificar que el botón **Alertas** de la tarjeta muestra el badge **`1`**.<br>2. Hacer clic en **Alertas** para navegar a `#/inmuebles/{id}/alertas`.<br>3. Verificar que el listado muestra el servicio (**Luz**), período (`fecha_inicio — fecha_fin`), tipo (**Consumo alto** o **Consumo bajo**), porcentaje de desvío (`+XX.X%`) y estado (**PENDIENTE**).<br>4. Hacer clic sobre la alerta en la lista.<br>5. Verificar que en **Detalle del período** aparecen el desvío detectado, consumo total, consumo diario registrado, consumo habitual esperado y el gráfico comparativo del período. | `test_alertas.py`, `PanelAlertas.test.jsx`, `PanelInmuebles.test.jsx` | ☐ |
| 2 | **Sin alertas registradas.** Si el inmueble no tiene alertas, veo el mensaje de que el consumo está dentro de lo normal. | 1. Volver a **Mis inmuebles** y verificar que `Depto Sur` muestra el badge **`0`** en **Alertas**.<br>2. Hacer clic en **Alertas** de `Depto Sur`.<br>3. Verificar que se muestra el aviso verde **El consumo está dentro de lo normal** y el texto indicando que el inmueble no registra desvíos anómalos. | `test_alertas.py`, `PanelAlertas.test.jsx` | ☐ |
| 3 | **Filtros por servicio y estado.** Puedo filtrar el listado por servicio y por estado. | 1. En `Casa Norte` (con alerta pendiente en Luz), seleccionar **Gas** en el filtro **Servicio**.<br>2. Verificar que la lista queda vacía y muestra **No hay alertas que coincidan con los filtros seleccionados**.<br>3. Volver a **Todos los servicios** y seleccionar **Confirmada** en **Estado**: también queda vacía.<br>4. Seleccionar **Luz** y **Pendiente** (o pulsar **Limpiar filtros**): la alerta vuelve a aparecer. | `test_alertas.py`, `PanelAlertas.test.jsx` | ☐ |

## Comprobaciones de apoyo (subtareas DET-91, DET-96 a DET-99)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Contador en tarjeta (DET-91, DET-98).** Cada tarjeta refleja sus alertas pendientes. | 1. Cargar una lectura anómala en `Casa Norte` desde **+ Cargar consumo**.<br>2. Verificar que el badge de **Alertas** en la tarjeta de `Casa Norte` se actualiza con el nuevo total pendiente sin afectar a otros inmuebles. | `test_inmuebles_incluye_contador_alertas_pendientes`, `PanelInmuebles.test.jsx` | ☐ |
| B | **Aislamiento entre usuarios (RN-01).** Nadie puede ver alertas de inmuebles ajenos. | 1. Con Carlos autenticado, intentar abrir `#/inmuebles/{id_de_laura}/alertas` o consultar `GET /api/inmuebles/{id_de_laura}/alertas` y `GET /api/alertas/{alerta_de_laura}` en `/docs`.<br>2. Verificar que el backend responde `404` (`Inmueble no encontrado.` / `Alerta no encontrada.`) y la interfaz muestra el mensaje de error sin filtrar datos. | `test_alertas_inmueble_inexistente_o_ajeno_da_404`, `PanelAlertas.test.jsx` | ☐ |
| C | **Protección de rutas privadas.** Sin sesión no se accede a las alertas. | 1. Cerrar sesión e intentar entrar directamente a `#/inmuebles/1/alertas`.<br>2. Verificar que redirige a `#/acceso`. | `Rutas.test.jsx` | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo esperado y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-15) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/` (desde la raíz) | ☐ pasa — ___ pruebas |
| `npm test -- --run` (en `frontend`) | ☐ pasa — ___ pruebas |
| `npm run build` (en `frontend`) | ☐ compila |

**Observaciones:**

## Definition of Done del equipo

- ☐ PR **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/`, `npm test -- --run` y `npm run build` pasan en verde.
- ☐ No hay contraseñas, claves ni `.env` en el cambio; `backend/ecodet.db` no está versionado.
- ☐ Todos los endpoints de alertas usan `Depends(get_current_user)` y filtran por `usuario_id` (RN-01).
- ☐ Los criterios de aceptación probados a mano por alguien que no escribió el código.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-23, DET-91, DET-96 a DET-99).