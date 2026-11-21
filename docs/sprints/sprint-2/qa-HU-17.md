# QA · HU-17 Confirmar una alerta (DET-25 y sus subtareas)

> **Quién prueba:** alguien que **no** escribió el código de HU-17.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura necesita un inmueble `Casa Norte` con **6 lecturas estables de Luz** (100 kWh cada una, del 01 al 28 de enero, febrero, marzo, abril, mayo y junio de 2025) y **dos lecturas anómalas** de 450 kWh (del 01 al 28 de julio y del 01 al 28 de agosto de 2025). Eso deja **dos alertas pendientes**: la de julio (`+350.0%`) y la de agosto (`+200.0%`). Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** en la vista de alertas del inmueble (`#/inmuebles/{id}/alertas`, vista W5), en el detalle de una alerta pendiente. El endpoint `PATCH /api/alertas/{id}/confirmar` se puede inspeccionar en `http://localhost:8000/docs` (para llamarlo, usar **Authorize** con el token de la persona que inició sesión).
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no incluye:** marcar una alerta como normal (HU-16, ya cubierta en `qa-HU-16.md`) ni ajustar el umbral (HU-18).

## Criterios de aceptación (HU-17)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Confirmar sale de las pendientes.** Dada una alerta pendiente, cuando elijo "Confirmar", entonces pasa a estado "confirmada" y sale de las pendientes. | 1. Como Laura, en **Mis inmuebles**, pulsar **Alertas** en `Casa Norte` y verificar que el badge muestra **`2`**.<br>2. Hacer clic en la alerta del `2025-07-01 — 2025-07-28` y verificar que, bajo el gráfico, aparecen los botones **Confirmar** y **Marcar como normal**.<br>3. Pulsar **Confirmar**.<br>4. Verificar el aviso verde **Alerta confirmada: quedó registrada como revisada y sale de las pendientes.** (no se abre ningún diálogo).<br>5. Verificar que la alerta de julio muestra el estado **CONFIRMADA** (verde) en la lista y en el detalle, que el detalle explica que fue confirmada y que **ya no hay** botones de decisión.<br>6. En el filtro **Estado** elegir **Pendiente**: solo queda la alerta de agosto. Elegir **Confirmada**: solo aparece la de julio.<br>7. Recargar la página (F5): la alerta de julio sigue **CONFIRMADA**.<br>8. Volver a **Mis inmuebles**: el badge de **Alertas** de `Casa Norte` muestra **`1`**. | `test_alertas_confirmar_hu17.py` (`test_confirmar_cambia_el_estado…`, `test_la_alerta_confirmada_sale_de_las_pendientes`), `PanelAlertas.test.jsx` | ☐ |
| 2 | **Confirmar no cambia el cálculo del detector.** | 1. Con la alerta de julio ya confirmada (criterio 1), abrir `/docs` con Laura autorizada y ejecutar `POST /api/consumos` para `Casa Norte` con `servicio` `LUZ`, `fecha_inicio` `2025-09-01`, `fecha_fin` `2025-09-28` y `consumo` `100`.<br>2. En `evaluacion` verificar `cantidad_referencia` = `8` y `promedio` ≈ `6.696`: la lectura confirmada de julio sigue integrando la referencia junto con las 6 estables y la de agosto. (Una lectura marcada como normal sí se excluiría: serían `7` y ≈ `5.357`). | `test_confirmar_no_cambia_el_calculo_del_detector` | ☐ |

## Comprobaciones de apoyo (subtareas de HU-17)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión (RN-01).** | 1. En `/docs`, `PATCH /api/alertas/{id}/confirmar` sin autorizar → `401`. | `test_confirmar_sin_token_da_401` | ☐ |
| B | **De otro usuario o inexistente (RN-01).** | 1. En `/docs`, autorizado como Carlos, `PATCH /api/alertas/{id}/confirmar` con el `id` de una alerta de Laura → `404` `Alerta no encontrada.`<br>2. Repetir con un `id` que no existe: misma respuesta.<br>3. Como Laura, verificar que su alerta sigue **PENDIENTE**. | `test_alerta_inexistente_o_ajena_da_404_y_no_se_modifica` | ☐ |
| C | **Solo se decide una alerta pendiente (RN-13).** | 1. En `/docs`, como Laura, repetir el `PATCH` sobre la alerta de julio, que ya está confirmada → `409` `Solo se puede confirmar una alerta pendiente.`<br>2. Probar `PATCH /api/alertas/{id}/normal` sobre esa misma alerta → `409` `Solo se puede marcar como normal una alerta pendiente.`<br>3. Verificar que la alerta sigue **CONFIRMADA**. | `test_confirmar_dos_veces_la_misma_alerta_da_409`, `test_una_alerta_normal_no_se_puede_confirmar_ni_una_confirmada_marcar_normal` | ☐ |
| D | **Solo cambia esa alerta (RN-17).** | 1. Antes de confirmar la de julio, abrir la alerta de agosto y anotar su desvío (`+200.0%`), el consumo diario registrado y el habitual esperado.<br>2. Confirmar la de julio.<br>3. Abrir de nuevo la de agosto: los tres valores son los mismos y sigue **PENDIENTE**. | `test_confirmar_no_recalcula_las_demas_alertas` | ☐ |
| E | **Alerta desactualizada.** | 1. Abrir las alertas de `Casa Norte` en dos pestañas del navegador.<br>2. En la primera, confirmar la alerta de julio.<br>3. En la segunda (sin recargar), pulsar **Confirmar** sobre esa misma alerta: aparece **Solo se puede confirmar una alerta pendiente.** y la lista se actualiza con el estado real. | `PanelAlertas.test.jsx` (respuesta `409`) | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo esperado y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-17) | |
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
- ☐ El endpoint de confirmación usa `Depends(get_current_user)` y filtra por `usuario_id` (RN-01).
- ☐ Los criterios de aceptación probados a mano por alguien que no escribió el código.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-25 y sus subtareas).
