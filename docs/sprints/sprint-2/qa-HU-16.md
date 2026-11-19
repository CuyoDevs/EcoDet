# QA · HU-16 Marcar una alerta como "normal" (DET-24, DET-100 a DET-103)

> **Quién prueba:** alguien que **no** escribió el código de HU-16.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura necesita un inmueble `Casa Norte` con **6 lecturas estables de Luz** (100 kWh cada una, del 01 al 28 de enero, febrero, marzo, abril, mayo y junio de 2025) y **dos lecturas anómalas** de 450 kWh (del 01 al 28 de julio y del 01 al 28 de agosto de 2025). Eso deja **dos alertas pendientes**: la de julio (`+350.0%`) y la de agosto (`+200.0%`). Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** en la vista de alertas del inmueble (`#/inmuebles/{id}/alertas`, vista W5), en el detalle de una alerta pendiente. El endpoint `PATCH /api/alertas/{id}/normal` se puede inspeccionar en `http://localhost:8000/docs` (para llamarlo, usar **Authorize** con el token de la persona que inició sesión).
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no incluye:** confirmar una alerta (HU-17) ni ajustar el umbral (HU-18).

## Criterios de aceptación (HU-16)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Pide confirmación.** Dada una alerta pendiente, cuando elijo "Marcar como normal", entonces el sistema pide confirmación. | 1. Como Laura, en **Mis inmuebles**, pulsar **Alertas** en `Casa Norte`.<br>2. Hacer clic en la alerta del `2025-07-01 — 2025-07-28` y verificar que, bajo el gráfico, aparece el botón **Marcar como normal**.<br>3. Pulsar el botón.<br>4. Verificar que se abre el diálogo **Marcar como normal** con el servicio (**Luz**), el período (`2025-07-01 al 2025-07-28`) y la advertencia de que la lectura dejará de usarse en las próximas detecciones y las alertas ya recibidas no cambian.<br>5. Verificar que, detrás del diálogo, la alerta sigue en estado **PENDIENTE**. | `PanelAlertas.test.jsx`, `MarcarAlertaNormalModal.test.jsx` | ☐ |
| 2 | **Confirmar la marca.** Dado que confirmo, cuando acepto, entonces la alerta pasa a estado normal, sale de las pendientes y esa lectura se excluye del cálculo del promedio y del desvío en las detecciones siguientes. | 1. Con el diálogo del criterio 1 abierto, pulsar **Sí, marcar como normal**.<br>2. Verificar el aviso verde **Marcada como normal: esta lectura se excluirá de los próximos cálculos.**<br>3. Verificar que la alerta de julio muestra el estado **NORMAL** (gris) en la lista y en el detalle, que el detalle explica que fue marcada como normal y que **ya no hay** botón **Marcar como normal**.<br>4. En el filtro **Estado** elegir **Pendiente**: solo queda la alerta de agosto. Elegir **Normal**: solo aparece la de julio.<br>5. Volver a **Mis inmuebles**: el badge de **Alertas** de `Casa Norte` muestra **`1`**.<br>6. En `/docs`, con Laura autorizada, ejecutar `POST /api/consumos` para `Casa Norte` con `servicio` `LUZ`, `fecha_inicio` `2025-09-01`, `fecha_fin` `2025-09-28` y `consumo` `100`.<br>7. En `evaluacion` verificar `cantidad_referencia` = `7` y `promedio` ≈ `5.357` (las 6 lecturas estables y la alerta pendiente de agosto; la lectura de julio ya no cuenta. Si se hubiera contado, serían `8` y ≈ `6.696`). | `test_alertas_normal_hu16.py` (`test_marcar_normal_cambia_el_estado…`, `test_la_alerta_marcada_sale_de_las_pendientes`, `test_la_lectura_marcada_normal_no_integra_la_referencia…`), `PanelAlertas.test.jsx` | ☐ |
| 3 | **Cancelar.** Dado que cancelo, cuando salgo de la confirmación, entonces la alerta queda como estaba. | 1. Con una alerta pendiente (reiniciar la base si hace falta), abrir su detalle y pulsar **Marcar como normal**.<br>2. Pulsar **Cancelar** (o la tecla **Esc**).<br>3. Verificar que el diálogo se cierra, que la alerta sigue **PENDIENTE** en la lista y en el detalle y que el botón **Marcar como normal** sigue disponible.<br>4. Volver a **Mis inmuebles** y verificar que el badge de **Alertas** no cambió. | `PanelAlertas.test.jsx`, `MarcarAlertaNormalModal.test.jsx` | ☐ |

## Comprobaciones de apoyo (subtareas DET-100 a DET-103)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión (RN-01).** | 1. En `/docs`, `PATCH /api/alertas/{id}/normal` sin autorizar → `401`. | `test_marcar_normal_sin_token_da_401` | ☐ |
| B | **De otro usuario o inexistente (RN-01).** | 1. En `/docs`, autorizado como Carlos, `PATCH /api/alertas/{id}/normal` con el `id` de una alerta de Laura → `404` `Alerta no encontrada.`<br>2. Repetir con un `id` que no existe: misma respuesta.<br>3. Como Laura, verificar que su alerta sigue **PENDIENTE**. | `test_alerta_inexistente_o_ajena_da_404_y_no_se_modifica` | ☐ |
| C | **Solo se marca una alerta pendiente (RN-13).** | 1. En `/docs`, como Laura, repetir el `PATCH` sobre una alerta que ya está normal → `409` `Solo se puede marcar como normal una alerta pendiente.`<br>2. Verificar que la alerta sigue en **NORMAL**. | `test_marcar_dos_veces_la_misma_alerta_da_409`, `test_una_alerta_confirmada_no_se_puede_marcar_normal` | ☐ |
| D | **Solo hacia adelante (RN-17).** Marcar una alerta no recalcula las demás. | 1. Antes de marcar la de julio, abrir la alerta de agosto y anotar su desvío (`+200.0%`), el consumo diario registrado y el habitual esperado.<br>2. Marcar como normal la de julio.<br>3. Abrir de nuevo la de agosto: los tres valores son los mismos y sigue **PENDIENTE**. | `test_marcar_normal_no_recalcula_las_alertas_ya_generadas` | ☐ |
| E | **Alerta desactualizada.** | 1. Abrir las alertas de `Casa Norte` en dos pestañas del navegador.<br>2. En la primera, marcar como normal la alerta de julio.<br>3. En la segunda (sin recargar), intentar marcar esa misma alerta: el diálogo muestra **Solo se puede marcar como normal una alerta pendiente.** y la lista se actualiza con el estado real. | `PanelAlertas.test.jsx` (respuesta `409`) | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo esperado y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-16) | |
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
- ☐ El endpoint de marcado usa `Depends(get_current_user)` y filtra por `usuario_id` (RN-01).
- ☐ Los criterios de aceptación probados a mano por alguien que no escribió el código.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-24, DET-100 a DET-103).
