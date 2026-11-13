# QA · HU-11 Editar o eliminar una lectura (DET-73 a DET-78)

> **Quién prueba:** alguien que **no** escribió el código de HU-11.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura tiene un inmueble `Casa Norte` con **al menos 3 lecturas de luz mensuales seguidas** (ej. enero, febrero y marzo de 2026) y una de gas.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Dónde está:** **Ver historial** → desplegar **Ver N lecturas** de un servicio → columna **Acciones** (Editar / Eliminar).
> **Alcance actual:** el motor de detección (HU-12) todavía no existe, así que "volver a evaluar la lectura" hoy solo descarta la alerta anterior (RN-17: las demás no se tocan). Cuando HU-12 esté en `main`, repetir el criterio 2.

## Criterios de aceptación (los cuatro de HU-11)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Editar con valores válidos.** Se guarda con las mismas validaciones que la carga. | 1. Como Laura, **Editar** en la lectura de febrero: el modal trae servicio, fechas y consumo actuales.<br>2. Cambiar el consumo y **Guardar cambios**: el modal se cierra y el historial, el gráfico y las estadísticas muestran el valor nuevo.<br>3. **F5**: el cambio persiste.<br>4. Probar datos inválidos: consumo negativo, fecha de fin anterior al inicio, fecha de fin futura → error bajo el campo y el modal queda abierto con la lectura sin cambios.<br>5. Mover febrero para que pise a enero → aviso de período superpuesto. Guardar con las mismas fechas y otro consumo **no** da superposición.<br>6. Cambiar el servicio de luz a gas: la lectura pasa al panel de gas. | `test_editar_*` (`test_lecturas_editar_eliminar.py`), `HistorialEditarEliminar.test.jsx` | ☐ |
| 2 | **Se vuelve a evaluar y la alerta anterior se reemplaza.** | 1. Con una lectura que tenga alerta (⚠; hasta que exista HU-12 se puede insertar una alerta a mano en `backend/ecodet.db`), editarla y guardar.<br>2. El ⚠ de esa lectura desaparece (hoy no hay motor; con HU-12 debe quedar el resultado nuevo).<br>3. Las ⚠ de las otras lecturas siguen igual. | `test_editar_descarta_la_alerta_anterior_de_la_lectura`, `test_editar_no_toca_las_alertas_ni_los_datos_de_otras_lecturas` | ☐ |
| 3 | **Eliminar con confirmación.** Al confirmar desaparece del historial junto con su alerta. | 1. **Eliminar** en la lectura de marzo: aviso **Eliminar lectura** con el período y *también se borrará su alerta*; botones **Cancelar** y **Sí, eliminar**. La lectura sigue en la lista.<br>2. **Sí, eliminar**: el aviso se cierra y la lectura desaparece del historial y del gráfico.<br>3. **F5**: no vuelve.<br>4. Cargar de nuevo ese mismo período desde **+ Cargar consumo**: se permite. | `test_eliminar_*`, `test_tras_eliminar_el_periodo_queda_libre_para_volver_a_cargarlo`, `HistorialEditarEliminar.test.jsx` | ☐ |
| 4 | **Editar o eliminar no recalcula las alertas de otras lecturas (RN-17).** | 1. Anotar qué lecturas tienen ⚠.<br>2. Editar o eliminar una lectura sin alerta.<br>3. Las ⚠ de las demás quedan idénticas. | `test_editar_no_toca_*`, `test_eliminar_no_toca_las_otras_lecturas_ni_sus_alertas` | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Cancelar no cambia nada.** | 1. Abrir **Editar**, cambiar un valor y **Cancelar** (o `Esc`): la lectura sigue igual.<br>2. Abrir **Eliminar** y **Cancelar** (o `Esc`): la lectura sigue. | `HistorialEditarEliminar.test.jsx` | ☐ |
| B | **Sin sesión / de otro usuario (RN-01).** | 1. En `http://localhost:8000/docs`, `PUT` y `DELETE /api/consumos/{id}` sin autorizar → 401.<br>2. Autorizado como Carlos, con el `id` de una lectura de Laura → 404 `Lectura no encontrada.` y la lectura de Laura sigue igual. | `test_editar_la_lectura_de_otro_usuario_da_404_y_no_la_modifica`, `test_eliminar_la_lectura_de_otro_usuario_da_404_y_no_la_borra` | ☐ |
| C | **Inexistente o ya eliminada.** | 1. `DELETE` con un `id` inexistente (ej. `99999`) → 404.<br>2. `DELETE` dos veces el mismo `id` → 204 y luego 404. | `test_eliminar_una_lectura_inexistente_da_404`, `test_eliminar_dos_veces_la_misma_lectura_da_404_la_segunda` | ☐ |
| D | **El inmueble no se puede cambiar.** | 1. En `/docs`, `PUT` con otro `inmueble_id` en el cuerpo: responde 200 y la lectura sigue en su inmueble. | `test_el_inmueble_de_una_lectura_no_se_puede_cambiar` | ☐ |
| E | **Efecto en el detector (RN-07).** | 1. Con exactamente 6 lecturas de luz, el panel dice **Detector activo**.<br>2. Eliminar una: pasa a **Detector inactivo**. | `test_eliminar_puede_desactivar_el_detector_por_el_minimo_de_lecturas` | ☐ |
| F | **Servidor caído.** | 1. Detener el backend, abrir **Editar** y **Guardar cambios**: aviso **No se pudo conectar con el servidor…** dentro del modal, sin perder lo escrito.<br>2. Igual con **Eliminar** → **Sí, eliminar**: el error aparece en el aviso y la lectura sigue. | `HistorialEditarEliminar.test.jsx` | ☐ |
| G | **Sin doble envío.** | 1. Con throttling "Slow 3G", clic en **Guardar cambios** / **Sí, eliminar**: el botón pasa a **Guardando…** / **Eliminando…** y los botones quedan deshabilitados; sale una sola petición. | `HistorialEditarEliminar.test.jsx` | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-11) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/` (desde la raíz) | ☐ pasa — ___ pruebas |
| `npm test` (en `frontend`) | ☐ pasa — ___ pruebas |
| `npm run build` (en `frontend`) | ☐ compila |

**Observaciones:**

## Definition of Done del equipo

- ☐ PR **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` y `npm test` / `npm run build` pasan.
- ☐ No hay contraseñas, claves ni `.env` en el cambio; `backend/ecodet.db` no está versionado.
- ☐ Cada usuario edita y elimina solo sus propias lecturas (RN-01), verificado a mano y con pruebas.
- ☐ Validaciones y mensajes coinciden con CU-09 y con la carga (HU-08).
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-73 a DET-78).
