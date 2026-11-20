# QA · HU-18 Ajustar la sensibilidad del detector (DET-26)

> **Quién prueba:** alguien que **no** escribió el código de HU-18.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura debe tener un inmueble `Casa Norte` con 5 lecturas de luz de 1 día cada una, del 1 al 5 de enero de 2025, con consumos `17, 17, 20, 23, 23` (promedio 20, desvío 3). Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** al pie de la vista de alertas del inmueble (`#/inmuebles/{id}/alertas`, wireframe W5), en el bloque **Sensibilidad del detector**. Los endpoints `GET /api/inmuebles/{id}/umbrales` y `PUT /api/inmuebles/{id}/umbrales/{servicio}` se pueden inspeccionar en `http://localhost:8000/docs`.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no hace:** cambiar el umbral **no recalcula** las alertas ya generadas; aplica a las detecciones siguientes (RN-17).

## Criterios de aceptación (los cuatro de HU-18)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Un umbral válido se guarda y se aplica a las detecciones siguientes.** Con un inmueble y un servicio elegidos, un número mayor que cero se guarda. | 1. Como Laura, abrir las alertas de `Casa Norte`. En **Umbral de Luz (desvíos)** escribir `3,5` y clic en **Guardar**.<br>2. Aparece el aviso verde **Umbral de Luz guardado: 3,5 desvíos. Se aplica a las próximas lecturas.** y debajo **Vigente: 3,5 desvíos**.<br>3. Recargar (F5): sigue en `3,5`. Gas y Agua siguen en `2,0`.<br>4. En `/docs`, `POST /api/consumos` con una sexta lectura de luz del 6 de enero de 2025 y consumo `27`: `evaluacion.estado = "dentro"`, `umbral = 3.5`, `limite_superior = 30.5` y no se crea alerta (con el umbral 2 sería **alta**, límite 26). | `test_put_valido_guarda_y_get_lo_refleja`, `test_el_umbral_guardado_cambia_el_resultado_del_detector`, `PanelUmbrales.test.jsx` (*guarda un valor válido*) | ☐ |
| 2 | **Un valor no numérico, cero o negativo se rechaza y se conserva el anterior.** | 1. Con la luz en `3,5`, escribir `abc` y **Guardar**: aparece **Ingresá un número mayor que cero.** y sigue **Vigente: 3,5 desvíos**.<br>2. Repetir con `0`, `-1` y el campo vacío: mismo resultado.<br>3. En `/docs`, `PUT /api/inmuebles/{id}/umbrales/LUZ` con `{"desvios": 0}`, `-1`, `"abc"`, `null` y `true`: siempre `422` con `errores.desvios = "El umbral debe ser un número mayor que cero."`.<br>4. `GET /api/inmuebles/{id}/umbrales`: luz sigue en `3.5`. | `test_valor_invalido_da_422_y_conserva_el_umbral_anterior`, `test_infinito_y_nan_se_rechazan`, `PanelUmbrales.test.jsx` (*rechaza …*) | ☐ |
| 3 | **La pantalla explica que un umbral mayor genera menos alertas y uno menor, más.** | 1. En el bloque **Sensibilidad del detector** leer el texto: **Un umbral mayor genera menos alertas y uno menor, más. El cambio se aplica a las próximas lecturas; las alertas ya generadas no se modifican.**<br>2. Verificar que el bloque se ve también en un inmueble **sin alertas** (junto al mensaje *El consumo está dentro de lo normal*). | `PanelUmbrales.test.jsx` (*explica que más umbral…*), `PanelAlertas.test.jsx` (*aunque el inmueble no tenga alertas*) | ☐ |
| 4 | **El valor inicial es 2 desvíos para cada inmueble y servicio.** | 1. Crear un inmueble nuevo y abrir sus alertas: Luz, Gas y Agua muestran `2,0` y **Vigente: 2,0 desvíos**.<br>2. En `/docs`, `GET /api/inmuebles/{id}/umbrales`: tres filas (`LUZ`, `GAS`, `AGUA`) con `desvios = 2.0` y `personalizado = false`.<br>3. El valor sale de `backend/config.json` (`umbral_inicial_en_desvios`). | `test_get_devuelve_el_umbral_inicial_de_los_tres_servicios`, `PanelUmbrales.test.jsx` (*muestra los tres servicios…*) | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión.** | 1. En `/docs`, `GET` y `PUT` de umbrales sin autorizar → `401`. | `test_sin_token_da_401` | ☐ |
| B | **Inmueble ajeno o inexistente (RN-01).** | 1. Autorizado como Carlos, `GET` y `PUT` con el `id` de `Casa Norte` de Laura → `404` `Inmueble no encontrado.`.<br>2. Lo mismo con un `id` inexistente (`9999`).<br>3. Como Laura, verificar que su umbral no cambió. | `test_inmueble_ajeno_o_inexistente_da_404_y_no_se_modifica` | ☐ |
| C | **Cada servicio es independiente.** | 1. Guardar luz en `3,5` y gas en `1,5`: cada uno conserva su valor y Agua sigue en `2,0`. | `test_put_valido_guarda_y_get_lo_refleja` | ☐ |
| D | **No se recalculan alertas ya generadas (RN-17).** | 1. Con luz en `2,0`, cargar la sexta lectura de `27`: se genera una alerta **alta** pendiente.<br>2. Cambiar el umbral de luz a `10`.<br>3. La alerta sigue en la lista, **Pendiente** y **Consumo alto**. | `test_cambiar_el_umbral_no_toca_las_alertas_ya_generadas` | ☐ |
| E | **Guardar dos veces el mismo servicio.** | 1. Guardar luz en `3` y luego en `4,25`: queda `4,25` (no se duplica la fila en `umbrales_servicio`). | `test_guardar_dos_veces_actualiza_la_misma_fila` | ☐ |
| F | **Servidor caído.** | 1. Detener el backend y clic en **Guardar** en un servicio.<br>2. Aviso **No se pudo conectar con el servidor…** y el valor vigente no cambia. | `PanelUmbrales.test.jsx` (*si no hay conexión…*) | ☐ |
| G | **Coma o punto decimal.** | 1. Guardar `2,5` y `2.5`: ambos se aceptan y se muestran como `2,5`. | `PanelUmbrales.test.jsx` (*guarda un valor válido (con coma decimal)*) | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-18) | |
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
- ☐ Cada usuario ve y modifica solo los umbrales de sus propios inmuebles (RN-01), verificado a mano y con pruebas.
- ☐ El valor inicial (2 desvíos) sale de `backend/config.json` (RN-09) y el cambio aplica solo hacia adelante (RN-17).
- ☐ Validaciones y mensajes coinciden con CU-07.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-26 y sus subtareas).
