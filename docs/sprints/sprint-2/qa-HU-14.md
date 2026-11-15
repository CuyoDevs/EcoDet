# QA · HU-14 Saber que el sistema todavía está aprendiendo (DET-92 a DET-95)

> **Quién prueba:** alguien que **no** escribió el código de HU-14.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura necesita un inmueble nuevo (`Casa Norte`) **sin lecturas**. Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** el aviso en la pantalla de carga de lecturas (W3: **Cargar lectura** dentro del inmueble) y el progreso en el historial de consumos (W4). La respuesta técnica (`evaluacion`) se puede inspeccionar en `http://localhost:8000/docs`.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué no incluye:** la pantalla de alertas (HU-15) todavía no existe, y la creación de la alerta al cargar es de HU-13. Por eso "entrar a las alertas" y ver la alerta generada se prueban cuando esas historias estén mergeadas.

## Criterios de aceptación (los dos de HU-14)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Menos de 6 lecturas.** Al guardar una lectura no se genera ninguna alerta y veo "aún estamos aprendiendo tu patrón". | 1. En `Casa Norte`, abrir **Cargar lectura**, servicio **Luz**, y registrar la primera lectura (por ejemplo `01/01/2025` a `31/01/2025`, `120` kWh).<br>2. Verificar que aparece el mensaje de éxito **y** debajo el aviso **Aún estamos aprendiendo tu patrón. Faltan 5 lecturas de luz…** y que dice que no se generan alertas.<br>3. Cargar la segunda, tercera, cuarta y quinta lectura (meses siguientes, sin superponerse). El aviso debe decir **Faltan 4, 3, 2** y finalmente **Falta 1 lectura** (en singular).<br>4. Probar con consumos muy distintos entre sí (por ejemplo `10` y `900`): igual **no** debe aparecer ninguna alerta.<br>5. Abrir el historial: ninguna lectura aparece marcada con alerta.<br>6. Cambiar el servicio a **Gas** y cargar una lectura: el aviso habla de **gas** y dice **Faltan 5 lecturas de gas** (cada servicio aprende por separado). | `test_aprendizaje_hu14.py`, `AvisoAprendizaje.test.jsx`, `FormularioConsumo.aprendizaje.test.jsx` | ☐ |
| 2 | **Al llegar a 6 lecturas** el mensaje desaparece y el detector empieza a evaluar. | 1. Cargar la **sexta** lectura de luz: debe aparecer el éxito **sin** el aviso de aprendizaje.<br>2. En el historial, el panel de Luz muestra **Detector activo** y la barra de progreso ya no se ve.<br>3. En `http://localhost:8000/docs`, con **Authorize**, ejecutar `GET /api/consumos/{inmueble_id}/historial`: en `LUZ`, `lecturas_faltantes` es `0` y `detector_activo` es `true`.<br>4. Cargar una séptima lectura con un consumo muy alto desde `POST /api/consumos` y revisar `evaluacion.estado`: ya **no** es `aprendiendo` (será `dentro`, `alta` o `baja`). *Persistir la alerta es de HU-13.* | `test_aprendizaje_hu14.py`, `FormularioConsumo.aprendizaje.test.jsx`, `HistorialConsumos.aprendizaje.test.jsx` | ☐ |

## Comprobaciones de apoyo (las subtareas de HU-14)

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Progreso en el historial (DET-94).** Cada servicio con lecturas pero sin llegar a 6 muestra cuánto lleva. | 1. Con 4 lecturas de luz, abrir el historial: el panel de Luz muestra **Aún estamos aprendiendo tu patrón**, una barra y **4 de 6 lecturas**, y **Faltan 2 lecturas para activar las alertas.**<br>2. Con 5 lecturas dice **Falta 1 lectura** (singular).<br>3. Un servicio sin lecturas no muestra barra (solo "Sin lecturas registradas").<br>4. El progreso también se entiende sin ver colores: hay texto con los números. | `ProgresoAprendizaje.test.jsx`, `HistorialConsumos.aprendizaje.test.jsx` | ☐ |
| B | **Carga histórica en lote (DET-93).** El resumen explica el estado de cada servicio. | 1. En **Carga histórica (lote)** cargar 4 lecturas de luz mensuales.<br>2. En **Estado del detector tras la carga**: Luz dice **Aún estamos aprendiendo tu patrón. Faltan 2 lecturas para empezar a evaluar.**; Gas y Agua dicen **Faltan 6 lecturas…**.<br>3. Cargar otro lote que lleve a Luz a 6 o más: Luz dice **Activo (≥ 6 lecturas)**. | `test_aprendizaje_hu14.py`, `FormularioConsumo.aprendizaje.test.jsx` | ☐ |
| C | **Eliminar vuelve a aprender (HU-11).** Si se borra una lectura y baja de 6, el progreso reaparece. | 1. Con 6 lecturas de luz, eliminar una desde el historial.<br>2. El panel de Luz vuelve a mostrar la barra **5 de 6 lecturas** y **Falta 1 lectura**. | `test_al_eliminar_una_lectura_vuelven_a_faltar_lecturas` | ☐ |
| D | **Aislamiento (RN-01).** Las lecturas de otra persona no cuentan. | 1. Con Carlos, cargar 6 lecturas de luz en su propio inmueble.<br>2. Con Laura, cargar la primera lectura de un inmueble nuevo: el aviso dice **Faltan 5 lecturas**, no menos. | `test_las_lecturas_de_otro_usuario_no_cuentan` | ☐ |
| E | **Error al guardar.** Si la lectura se rechaza no queda un aviso viejo. | 1. Cargar una lectura que se superponga con otra (mismo período y servicio): aparece el error bajo la fecha.<br>2. El aviso de aprendizaje de la carga anterior ya no se ve. | `FormularioConsumo.aprendizaje.test.jsx` | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo esperado y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-14) | |
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
- ☐ El mínimo de lecturas sale de `backend/config.json` (RN-09): ni el backend ni el frontend lo repiten a mano.
- ☐ El mensaje es el del criterio ("aún estamos aprendiendo tu patrón") y es el mismo en la carga y en el historial.
- ☐ Los criterios de aceptación probados a mano por alguien que no escribió el código.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-92 a DET-95).
