# QA · HU-12 Evaluar cada lectura contra mi historial (DET-79 a DET-85)

> **Quién prueba:** alguien que **no** escribió el código de HU-12.
> **Antes de empezar:** backend en `:8000` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura debe tener un inmueble (`Casa Norte`) con lecturas de luz mensuales no superpuestas.
> **Dónde se ve:** todavía **no hay pantalla nueva**: HU-12 es la lógica del detector. El resultado se inspecciona en `http://localhost:8000/docs` al ejecutar `POST /api/consumos` o `POST /api/consumos/lote`, campo `evaluacion` de cada lectura. HU-13 será quien muestre/guarde la alerta.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no hace todavía:** esta historia **no crea alertas** al cargar. La evaluación queda disponible para HU-13. La edición (HU-11) sigue reevaluando y reemplazando la alerta como antes.

## Criterios de aceptación (los seis de HU-12)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Con 6 o más lecturas se evalúa la nueva y no se usa a sí misma.** Se calcula su consumo por día y se compara contra las demás del mismo servicio. | 1. Como Laura, cargar 5 lecturas de luz de 1 día cada una con consumos `17, 17, 20, 23, 23` (por ejemplo, 1 al 5 de enero de 2025). En `/docs`, `POST /api/consumos`: cada respuesta trae `evaluacion.estado = "aprendiendo"`.<br>2. Cargar la sexta, también de 1 día, con consumo `20`: `evaluacion.estado = "dentro"`, `promedio = 20`, `cantidad_referencia = 5` (la evaluada no se cuenta).<br>3. Repetir con una sexta lectura de `27`: `estado = "alta"` y la referencia sigue siendo las otras cinco (promedio 20), no un promedio contaminado por la propia lectura. | `test_con_menos_de_seis_lecturas_el_detector_esta_aprendiendo`, `test_la_lectura_evaluada_no_integra_su_propia_referencia`, `test_post_individual_devuelve_la_evaluacion_y_no_crea_alertas` | ☐ |
| 2 | **Referencia estacional o general.** Si hay 3 o más lecturas de la misma estación (asignada por el punto medio del período), se usa esa; si no, el historial general. | 1. Cargar 3 lecturas de verano (enero/febrero) con 10 por día, 3 de invierno (junio/julio/agosto) con 100 por día y una de verano con 20.<br>2. En la respuesta de la lectura de verano: `referencia_estacional = true`, `cantidad_referencia = 3`, `promedio = 10` (ignora el invierno).<br>3. Repetir con solo **2** lecturas de verano: `referencia_estacional = false`, `cantidad_referencia = 5` y promedio general.<br>4. Verificar el punto medio: un período 31/1 a 1/2 cuenta como **verano** (punto medio 31/1), no como otoño. | `test_referencia_estacional_con_tres_o_mas_lecturas_de_la_estacion`, `test_referencia_general_con_menos_de_tres_lecturas_de_la_estacion`, `test_estacion_por_punto_medio_cruza_el_cambio_de_estacion`, `test_punto_medio_del_periodo` | ☐ |
| 3 | **Las lecturas "normal" quedan fuera de la referencia.** | 1. Con 5 lecturas base (`17, 17, 20, 23, 23`) y una lectura extrema de `1000` marcada como `NORMAL` en `alertas.estado`, cargar una lectura nueva de `20`.<br>2. En la respuesta: `promedio = 20` y `cantidad_referencia = 5`; la extrema no infla el promedio.<br>3. Si no se pudiera marcar a mano, la prueba automática inserta la alerta `NORMAL` directo en la base. | `test_las_lecturas_marcadas_normal_quedan_fuera_de_la_referencia` | ☐ |
| 4 | **Límites = promedio ± umbral × desvío efectivo.** Desvío efectivo = mayor entre desvío muestral y 10 % del promedio; umbral vigente del inmueble y servicio. **Caso 20 / 3 / 2 → 14 y 26.** | 1. Cargar las 5 lecturas base del caso (`17, 17, 20, 23, 23`, 1 día cada una).<br>2. Cargar una sexta de `20`: `promedio = 20`, `desvio_efectivo = 3`, `limite_inferior = 14`, `limite_superior = 26`, `umbral = 2`.<br>3. Probar `14` y `26`: `dentro` (los límites se incluyen). Probar `13,99`: `baja`; `26,01`: `alta`.<br>4. Historial idéntico de `100`: el desvío no es 0, es `10` (piso del 10 %), con límites `80` y `120`.<br>5. (Opcional) Insertar en `umbrales_servicio` un umbral `3,5` para esa luz: la respuesta debe traer `umbral = 3.5` y límites más amplios. | `test_caso_del_documento_promedio_20_desvio_3_umbral_2_da_14_y_26`, `test_evaluacion_aplica_el_caso_del_documento`, `test_clasificar_usa_los_limites_inclusivos`, `test_piso_del_diez_por_ciento_cuando_el_desvio_es_cero`, `test_piso_del_diez_por_ciento_tapa_un_desvio_muy_pequeno`, `test_umbral_vigente_es_el_inicial_y_luego_el_del_inmueble` | ☐ |
| 5 | **En una carga histórica se evalúa cada lectura del lote contra las demás del servicio.** | 1. En `/docs`, `POST /api/consumos/lote` con 6 lecturas de luz de 1 día y consumos `17, 17, 20, 23, 23, 27`.<br>2. La respuesta trae 6 filas: las cinco primeras `estado = "dentro"` y la de `27` `estado = "alta"`.<br>3. Cada fila tiene `cantidad_referencia = 5`: se comparó con las otras cinco del lote, sin compararse consigo misma.<br>4. La fila de `27` tiene `promedio = 20` y `limite_superior = 26`.<br>5. El lote sigue siendo todo o nada: si una fila se superpone, no se guarda ninguna (probar como en HU-09). | `test_lote_evalua_cada_fila_contra_las_demas_incluidas_las_del_lote`, `test_carga_lote_*` (`test_consumos.py`) | ☐ |
| 6 | **DoD: la lógica lleva pruebas automáticas con los casos del documento.** | 1. Desde la raíz: `python -m pytest backend/tests/` → todo en verde.<br>2. En `frontend`: `npm test` y `npm run build` → todo en verde (no hay pantalla nueva, pero se verifica que no se rompió nada). | `backend/tests/test_detector.py` | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Menos de 6 lecturas = "aprendiendo".** | 1. Con 5 lecturas de luz, cargar la quinta: `evaluacion.estado = "aprendiendo"` y `motivo = "lecturas_insuficientes"`, sin promedio ni límites.<br>2. Un lote de 3 lecturas de un servicio nuevo: las 3 quedan en `aprendiendo`. | `test_con_menos_de_seis_lecturas_el_detector_esta_aprendiendo`, `test_lote_con_menos_de_seis_lecturas_queda_aprendiendo` | ☐ |
| B | **Consumo por día con períodos de distinta duración (RN-06).** | 1. Cargar 310 kWh del 1 al 31 de enero → `consumo_por_dia = 10`.<br>2. Cargar 280 kWh del 1 al 28 de febrero → `consumo_por_dia = 10`.<br>3. Cargar 5 kWh de un solo día → `consumo_por_dia = 5`. | `test_consumo_por_dia_cuenta_ambos_extremos_del_periodo` | ☐ |
| C | **Estaciones del hemisferio sur.** | 1. Probar el punto medio de un período en cada mes: dic-feb `VERANO`, mar-may `OTOÑO`, jun-ago `INVIERNO`, sep-nov `PRIMAVERA`. | `test_estacion_de_asigna_el_hemisferio_sur` | ☐ |
| D | **La evaluación NO crea alertas (DET-83).** | 1. Antes de cargar, contar `SELECT COUNT(*) FROM alertas;`.<br>2. Cargar 6 lecturas (individuales o en lote) que darían alerta.<br>3. El conteo de `alertas` no cambia; el resultado solo viaja en la respuesta.<br>4. La edición de HU-11 sigue creando/reemplazando la alerta (no se rompió esa historia). | `test_post_individual_devuelve_la_evaluacion_y_no_crea_alertas`, `test_lote_evalua_cada_fila_contra_las_demas_incluidas_las_del_lote` | ☐ |
| E | **Sin sesión.** | 1. `POST /api/consumos` y `POST /api/consumos/lote` sin token → `401`. | `test_consumo_sin_token_da_401` | ☐ |
| F | **Inmueble ajeno (RN-01).** | 1. Autorizado como Carlos, `POST /api/consumos` con el `inmueble_id` de Laura → `404` y no se evalúa nada. | `test_consumo_inmueble_inexistente_o_ajeno_da_404` | ☐ |
| G | **El detector solo se activa con 6 o más.** | 1. `POST /api/consumos/lote` con 6 de luz y 2 de gas: `detector_activo_por_servicio = {"LUZ": true, "GAS": false, ...}`. | `test_carga_lote_exitosa_mixta` (`test_consumos.py`) | ☐ |
| H | **Documentación de la API.** | 1. Abrir `/docs`: los esquemas `LecturaCreadaOut`, `LecturaLoteOut` y `EvaluacionOut` muestran el campo `evaluacion` con `estado`, `promedio`, límites y `referencia_estacional`. | — | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-12) | |
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
- ☐ La evaluación no crea alertas: el resultado queda disponible para HU-13 (DET-83).
- ☐ El mínimo de lecturas, el umbral inicial y el piso del desvío salen de `backend/config.json` (RN-09).
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-79 a DET-85).
