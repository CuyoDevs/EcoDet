# QA · Ver historial y gráficos por servicio (DET-18 / HU-10)

> **Quién prueba:** alguien que **no** escribió el código de este módulo.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Es necesario tener al menos un usuario registrado e iniciar sesión, además de contar con al menos un inmueble creado en el panel.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación del módulo de historial y gráficos (HU-10)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **Gráfico por servicio ordenado cronológicamente (CU-05, RN-06).** Con lecturas registradas en un inmueble → al pulsar "Ver historial" se visualiza el gráfico de evolución por día para cada servicio ordenado por fecha de inicio. | 1. Entrar al panel de inmuebles.<br>2. Cargar 3 o más lecturas en orden aleatorio de fechas para Luz o Gas.<br>3. Hacer clic en **Ver historial** en la tarjeta del inmueble.<br>4. Verificar que se despliega el gráfico de línea con los puntos ordenados cronológicamente por período. | `test_historial_con_lecturas_devuelve_datos_correctos`, `HistorialConsumos.test.jsx` | ☐ |
| 2 | **Destacado visual de lecturas con alerta.** Si una lectura disparó una anomalía/alerta → su punto en el gráfico y la fila en la tabla se distinguen visualmente (color rojo / icono de advertencia). | 1. Cargar lecturas donde alguna posea alerta asociada.<br>2. Abrir el historial.<br>3. Verificar que el punto en el SVG es rojo y en el detalle/tabla figura el distintivo de alerta. | `HistorialConsumos.test.jsx` | ☐ |
| 3 | **Interacción y detalle del punto del gráfico.** Al hacer clic en un punto del gráfico → se muestra un cuadro/tooltip con el período, consumo total y consumo por día. | 1. Hacer clic sobre cualquiera de los puntos en el gráfico de línea.<br>2. Verificar que se abre el cuadro "Período seleccionado" con las fechas exactas, el consumo total y el consumo/día. | `HistorialConsumos.test.jsx` | ☐ |
| 4 | **Inmueble sin lecturas.** Si un inmueble no tiene lecturas en un servicio → se muestra el mensaje "Sin lecturas registradas" y un enlace directo para cargar la primera lectura. | 1. Crear un inmueble nuevo sin lecturas.<br>2. Hacer clic en **Ver historial**.<br>3. Verificar que para Luz y Gas aparece el mensaje y el botón "+ Cargar la primera lectura", el cual abre el formulario de carga. | `test_historial_inmueble_sin_lecturas_devuelve_listas_vacias`, `HistorialConsumos.test.jsx` | ☐ |
| 5 | **Agua opcional (RN-04).** Si un inmueble no tiene registros de agua, no se producen errores y la vista se muestra limpia y completa para Luz y Gas. | 1. Cargar lecturas únicamente para Luz y Gas.<br>2. Abrir historial.<br>3. Verificar que Agua figura simplemente como sin lecturas, sin afectar los gráficos de Luz ni Gas. | `test_historial_con_lecturas_devuelve_datos_correctos` | ☐ |
| 6 | **Estado del detector de anomalías (RN-07).** Indica si el detector está activo o inactivo (requiere $\ge 6$ lecturas). | 1. Con menos de 6 lecturas, verificar etiqueta "Detector inactivo".<br>2. Al cargar 6 lecturas o más, verificar que la etiqueta pasa a "Detector activo". | `test_historial_detector_activo_con_6_lecturas`, `HistorialConsumos.test.jsx` | ☐ |
| 7 | **Seguridad y aislamiento (401 / 404).** Peticiones sin token o a inmuebles ajenos son rechazadas. | 1. Intentar acceder a `/api/consumos/{id}/historial` sin cabecera de autenticación → 401.<br>2. Intentar acceder al historial de un inmueble perteneciente a otro usuario → 404. | `test_historial_sin_token_da_401`, `test_historial_inmueble_ajeno_da_404` | ☐ |

## Definition of Done del equipo
- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero**.
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa al 100%.
- ☐ `npm test` y `npm run build` pasan al 100%.
- ☐ No hay contraseñas, claves ni `.env` en el cambio.
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Listo**.
