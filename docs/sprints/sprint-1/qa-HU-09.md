# QA · Carga histórica de lecturas en lote (DET-17 / HU-09)

> **Quién prueba:** alguien que **no** escribió el código de este módulo.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Es necesario tener al menos un usuario registrado e iniciar sesión, además de contar con al menos un inmueble creado en el panel.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación de carga en lote (HU-09)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Carga masiva exitosa (201).** Con datos válidos de varias facturas pasadas → se guardan todas en una única operación. | 1. Entrar al panel de inmuebles y abrir el formulario de consumo.<br>2. Cambiar a la pestaña **Carga histórica (lote)**.<br>3. Agregar 3 o más filas de consumo con períodos consecutivos sin superposición.<br>4. Hacer clic en **Guardar todas las lecturas**.<br>5. Verificar mensaje de éxito con el total de lecturas guardadas. | `test_consumo_lote_exitoso_y_detector_se_activa_con_6_o_mas`, `FormularioConsumo.test.jsx` | ☐ |
| 2 | **Regla Todo o Nada (RN-15).** Si una fila tiene error, ninguna se guarda y se indican los errores específicos. | 1. En la pestaña lote, agregar 2 filas válidas y 1 fila con consumo negativo o fecha fin anterior a fecha inicio.<br>2. Intentar guardar.<br>3. Verificar código `409` / `422` del backend.<br>4. Verificar que se resaltan los errores en la fila infractora y no se guardó ninguna fila previa. | `test_consumo_lote_superposicion_interna_todo_o_nada`, `test_consumo_lote_superposicion_con_historial_todo_o_nada`, `FormularioConsumo.test.jsx` | ☐ |
| 3 | **Superposición interna en el lote (409).** Si dos filas del mismo servicio dentro del lote solapan sus períodos, se rechaza la operación completa. | 1. Agregar fila A: Gas `2026-01-01` a `2026-01-31`.<br>2. Agregar fila B: Gas `2026-01-15` a `2026-02-15`.<br>3. Guardar el lote.<br>4. Verificar rechazo 409 con detalle de superposición en la fila correspondiente y ninguna fila persistida. | `test_consumo_lote_superposicion_interna_todo_o_nada` | ☐ |
| 4 | **Superposición con historial existente (409).** Si una fila del lote se superpone con lecturas ya registradas en la base de datos, se rechaza todo el lote. | 1. Cargar previamente una lectura individual de Luz del `2026-05-01` al `2026-05-31`.<br>2. Intentar cargar un lote que incluya una lectura de Luz del `2026-05-20` al `2026-06-20`.<br>3. Verificar error 409 y que el lote no se guardó. | `test_consumo_lote_superposicion_con_historial_todo_o_nada` | ☐ |
| 5 | **Activación del detector de anomalías (RN-07).** Al alcanzar 6 o más lecturas en un servicio, el detector queda activo para ese servicio. | 1. En un inmueble nuevo, cargar un lote de 6 facturas pasadas del servicio Luz.<br>2. Al guardar exitosamente, verificar en la respuesta `detector_activo_por_servicio.LUZ == true` y en el cartel de éxito que se notifica la activación del detector para Luz. | `test_consumo_lote_exitoso_y_detector_se_activa_con_6_o_mas` | ☐ |
| 6 | **Seguridad y pertenencia (401 / 404).** Peticiones sin token o intentando cargar lote a inmueble ajeno son rechazadas. | 1. Enviar petición POST a `/api/consumos/lote` sin token → 401.<br>2. Enviar petición con `inmueble_id` de otro usuario → 404. | `test_consumos.py` | ☐ |

## Definition of Done del equipo
- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero**.
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa al 100%.
- ☐ `npm test` y `npm run build` pasan al 100%.
- ☐ No hay contraseñas, claves ni `.env` en el cambio.
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Listo**.
