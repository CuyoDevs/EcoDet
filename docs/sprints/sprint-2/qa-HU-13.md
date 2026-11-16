# QA · HU-13 Recibir una alerta de consumo alto o bajo (DET-86 a DET-90)

> **Quién prueba:** alguien que **no** escribió el código de HU-13.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173`. Registrar usuario `laura@correo.com` (`Clave1234`) y tener un inmueble con al menos 5 lecturas de luz (ej. `17, 17, 20, 23, 23` kWh en días consecutivos del 1 al 5 de enero).
> **Dónde se ve:** en la pantalla de carga de consumos (W3 / `http://localhost:5173`) tanto en lectura individual como en carga en lote, y en los endpoints `POST /api/consumos` y `POST /api/consumos/lote` (`http://localhost:8000/docs`).
> **Qué hace esta historia:** cuando una lectura cargada supera el límite superior (consumo alto) o queda por debajo del límite inferior (consumo inusualmente bajo), el sistema genera y persiste una alerta en estado `PENDIENTE`, devuelve el porcentaje de desvío y mensaje explicativo, y muestra un banner de advertencia inmediato en la interfaz (W3).

## Criterios de aceptación de HU-13

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :--- | :-: |
| 1 | **DET-86: Persistir alerta cuando el consumo es alto o bajo.** Se crea registro en `alertas` con `tipo` (`ALTA` o `BAJA`), `estado` inicial `PENDIENTE`, `desvio_porcentual` y asociado a la lectura. | 1. Con un historial base de 5 lecturas (`17, 17, 20, 23, 23` -> media 20, límites 14 a 26), cargar una 6ª lectura de consumo `31`.<br>2. En BD o `/docs`, verificar que se creó la alerta asociada a dicha lectura con `tipo = "ALTA"`, `estado = "PENDIENTE"`, `desvio_porcentual = 55.0%`.<br>3. Cargar otra lectura con consumo `10` -> se crea alerta con `tipo = "BAJA"`, `estado = "PENDIENTE"`, `desvio_porcentual = -50.0%`. | `test_caso_testigo_alerta_alta_persiste_y_devuelve_desvio_55_porciento`, `test_caso_testigo_alerta_baja_persiste_y_devuelve_desvio_menos_50_porciento` | ☐ |
| 2 | **DET-87: Respuesta enriquecida con mensaje y desvío porcentual.** La API responde `evaluacion.desvio_porcentual`, `evaluacion.mensaje` y el objeto `alerta`. | 1. En `/docs`, ejecutar `POST /api/consumos` con consumo `31`.<br>2. Inspeccionar la respuesta: `evaluacion.desvio_porcentual` es `55.0`, `evaluacion.alerta_generada` es `true`, `evaluacion.mensaje` detalla el 55.0% superior al habitual, y `alerta` contiene los datos completos de la alerta.<br>3. Probar consumo `20` (dentro de límites): `evaluacion.alerta_generada` es `false`, `alerta` es `null`, y mensaje indica consumo dentro de lo habitual. | `test_caso_testigo_alerta_alta_persiste_y_devuelve_desvio_55_porciento`, `test_consumo_normal_dentro_de_limites_no_genera_alerta` | ☐ |
| 3 | **DET-88: Advertencia visual inmediata en la UI (W3) para lectura individual.** | 1. En la aplicación web, ir a "Cargar lecturas" (W3) en modo individual.<br>2. Seleccionar el servicio Luz y cargar una lectura de consumo `31` kWh.<br>3. Al hacer clic en "Registrar consumo", debe aparecer inmediatamente un banner destacado de color ámbar con icono de advertencia, indicando "¡Alerta de Consumo Alto!", el desvío `+55%` y el mensaje explicativo.<br>4. Cargar una lectura de consumo `10` kWh -> el banner indica "¡Alerta de Consumo Bajo Inusual!" con el desvío `-50%`.<br>5. Cargar una lectura con consumo `20` kWh -> solo muestra mensaje de éxito verde y ningún banner de alerta. | `FormularioConsumo.test.jsx` ("muestra advertencia inmediata al cargar una lectura con alerta de consumo alto", "muestra advertencia inmediata al cargar una lectura con alerta de consumo bajo", "no muestra advertencia cuando el consumo está dentro de los límites") | ☐ |
| 4 | **DET-88: Detección y detalle de alertas en Carga Histórica (Lote).** | 1. En W3, seleccionar la pestaña "Carga histórica (lote)".<br>2. Cargar un lote de 6 lecturas (`17, 17, 20, 23, 23, 27`).<br>3. Al guardar con éxito, en el cuadro de resumen posterior se debe indicar el número de alertas generadas en el lote (1 alerta) y el detalle de la fila anómala (Consumo Alto +35%). | `test_lote_evalua_cada_fila_contra_las_demas_incluidas_las_del_lote`, `test_lote_con_multiples_anomalias_persiste_todas_las_alertas` | ☐ |
| 5 | **DET-89: Cobertura con pruebas automatizadas (DoD).** | 1. En la raíz, ejecutar `python -m pytest backend/tests` -> 212 tests pasan sin fallas.<br>2. En `frontend`, ejecutar `npm test` -> 146 tests pasan en 14 archivos.<br>3. Ejecutar `npm run build` -> compila limpiamente sin errores de sintaxis ni empaquetado. | `test_alertas_hu13.py`, `test_detector.py`, `FormularioConsumo.test.jsx` | ☐ |

## Comprobaciones complementarias

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :--- | :-: |
| A | **Estado aprendiendo no genera alertas.** Con menos de 6 lecturas, no se generan alertas en BD. | Cargar lecturas 1 a 5: `alerta` es `null`, en tabla `alertas` no hay registros para esas lecturas. | `test_caso_testigo_alerta_alta_persiste_y_devuelve_desvio_55_porciento` | ☐ |
| B | **Aislamiento por usuario e inmueble (RN-01).** Un usuario no puede consultar ni recibir alertas de inmuebles ajenos. | Intentar cargar consumo en un inmueble ajeno con token de otro usuario -> 404 Not Found. | Tests de seguridad en `test_consumos.py` | ☐ |
| C | **Edición previa (HU-11) y reemplazo de alerta.** | Editar una lectura anómala a un valor normal mediante PUT `/api/consumos/{id}` -> la alerta anterior se elimina y no se genera una nueva. | `test_lecturas_editar_eliminar.py` | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-13) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/` | ☐ pasa (212 pruebas) |
| `npm test` (en `frontend`) | ☐ pasa (146 pruebas) |
| `npm run build` (en `frontend`) | ☐ compila sin errores |

## Definition of Done del equipo

- ☐ PR **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ Pruebas automáticas de backend y frontend pasando en verde.
- ☐ Cero secretos, tokens o credenciales expuestas; base de datos SQLite no versionada.
- ☐ Alertas persistidas con estado `PENDIENTE` y asociadas a `lectura_id`.
- ☐ Banner interactivo y accesible en la interfaz W3.
- ☐ Subtareas en Jira (DET-86 a DET-90) y ticket padre DET-21 actualizados.
