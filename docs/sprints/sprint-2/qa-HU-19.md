# QA · HU-19 Cargar datos de ejemplo (DET-27)

> **Quién prueba:** alguien que **no** escribió el código de HU-19.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`) sin inmuebles. Para repetir desde cero, detener el backend y borrar `backend/ecodet.db`.
> **Dónde se ve:** en el panel **Mis inmuebles** (W2), botón **Cargar datos de ejemplo**, a la derecha de **Nuevo inmueble**.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué se carga:** un inmueble **Demo (ejemplo)** con datos fijos: luz y gas de nov 2024 a oct 2026 (24 meses) y agua de nov 2025 a oct 2026 (12 meses). Los datos y la tabla de resultados esperados están en `backend/app/services/datos_demo.py`.

## Tabla de resultados esperados

El detector, con el umbral inicial de 2 desvíos, tiene que marcar **solo** estas 9 lecturas (2 altas y 1 baja por servicio):

| Servicio | Período | Tipo |
| :--- | :--- | :--- |
| Luz | abr 2025 | Baja |
| Luz | jul 2025 | Alta |
| Luz | ene 2026 | Alta |
| Gas | ago 2025 | Alta |
| Gas | oct 2025 | Alta |
| Gas | abr 2026 | Baja |
| Agua | ene 2026 | Alta |
| Agua | abr 2026 | Baja |
| Agua | jul 2026 | Alta |

## Criterios de aceptación (los cuatro de HU-19)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Con la sesión iniciada, "Cargar datos de ejemplo" crea un inmueble identificado como demostración con 24 meses de luz y gas y 12 de agua.** | 1. Como Laura, en **Mis inmuebles** clic en **Cargar datos de ejemplo**.<br>2. Aparece el aviso verde **Cargamos "Demo (ejemplo)" con 9 alertas pendientes para que pruebes el detector.**<br>3. La tarjeta **Demo (ejemplo)** muestra el distintivo **Demostración** y el contador de alertas en `9`.<br>4. La tarjeta tiene **Eliminar** pero **no Editar**; un inmueble común sí tiene ambos.<br>5. **Ver historial**: Luz 24 lecturas (nov 2024 a oct 2026), Gas 24, Agua 12 (nov 2025 a oct 2026), con el detector activo en los tres. | `test_cargar_demo_crea_un_inmueble_identificado_como_demostracion`, `test_el_demo_tiene_24_meses_de_luz_y_gas_y_12_de_agua`, `PanelInmuebles.test.jsx` (*crea el inmueble de demostración…*, *se puede eliminar pero no editar*) | ☐ |
| 2 | **Por servicio hay 2 anomalías altas y 1 baja, y el detector las identifica todas.** | 1. En **Alertas** del inmueble demo hay 9 alertas pendientes.<br>2. Compararlas una por una con la **tabla de resultados esperados**: mismo servicio, período y tipo (*Consumo alto* o *Consumo bajo*).<br>3. No aparece ninguna alerta que no esté en la tabla. | `test_el_detector_marca_exactamente_las_lecturas_de_la_tabla_esperada`, `test_hay_2_altas_y_1_baja_por_servicio` | ☐ |
| 3 | **Si ya cargó los datos de ejemplo y vuelve a elegir la opción, el sistema avisa y no los duplica.** | 1. Con el demo ya cargado, clic otra vez en **Cargar datos de ejemplo**.<br>2. Aparece el aviso amarillo **Ya cargaste los datos de ejemplo. Elimina el inmueble de demostración si quieres volver a cargarlos.**<br>3. La lista sigue con **un solo** inmueble de demostración; recargar (F5) y verificar que sigue siendo uno. | `test_cargar_dos_veces_avisa_y_no_duplica`, `PanelInmuebles.test.jsx` (*si ya cargó los datos de ejemplo (409)…*) | ☐ |
| 4 | **Puede eliminar el inmueble de demostración cuando quiera (HU-07) y volver a cargarlo.** | 1. **Eliminar** en la tarjeta del demo: el aviso advierte que se borran lecturas y alertas; confirmar con **Sí, eliminar**.<br>2. La tarjeta desaparece.<br>3. Clic en **Cargar datos de ejemplo**: vuelve a crearse con las mismas 9 alertas. | `test_eliminar_el_demo_y_volver_a_cargarlo`, `PanelInmuebles.test.jsx` (*después de eliminar… se puede volver a cargar*) | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión.** | 1. En `http://localhost:8000/docs`, `POST /api/inmuebles/demo` sin autorizar → `401`. | `test_sin_token_da_401` | ☐ |
| B | **Cada usuario tiene su propio demo (RN-01, RN-16).** | 1. Con Laura ya con su demo, iniciar sesión como Carlos: no ve el de Laura.<br>2. Carlos carga el suyo sin problema.<br>3. En `/docs`, como Carlos, `GET /api/consumos/{id del demo de Laura}/historial` → `404`. | `test_cada_usuario_tiene_su_propio_demo_y_no_ve_el_ajeno` | ☐ |
| C | **Nombre ya ocupado.** | 1. Como un usuario nuevo, crear a mano un inmueble llamado `Demo (ejemplo)`.<br>2. **Cargar datos de ejemplo**: se crea `Demo (ejemplo) 2` con el distintivo **Demostración**, sin error. | `test_si_el_nombre_ya_esta_ocupado_usa_otro_y_igual_se_carga` | ☐ |
| D | **El demo no afecta a los demás inmuebles.** | 1. Con un inmueble común ya cargado, cargar el demo: el inmueble común conserva sus lecturas y alertas. | `test_el_listado_expone_es_demo_y_las_alertas_pendientes` | ☐ |
| E | **Servidor caído.** | 1. Detener el backend y clic en **Cargar datos de ejemplo**.<br>2. Aviso rojo **No se pudo conectar con el servidor…** y no se agrega ningún inmueble. | `PanelInmuebles.test.jsx` (*sin conexión muestra el aviso…*) | ☐ |
| F | **Botón deshabilitado mientras carga.** | 1. Clic en **Cargar datos de ejemplo**: mientras se crea, el botón dice **Cargando ejemplo…** y no se puede pulsar de nuevo. | `PanelInmuebles.test.jsx` (*mientras carga deshabilita el botón…*) | ☐ |
| G | **Fechas válidas (RN-03, RN-14).** | 1. En **Ver historial** del demo, ninguna lectura es posterior a hoy y no hay períodos superpuestos por servicio. | `test_las_fechas_del_demo_son_pasadas_y_no_se_superponen` | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-19) | |
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
- ☐ La lógica del detector se prueba con los casos del documento: la tabla de resultados esperados coincide con las alertas generadas.
- ☐ No hay contraseñas, claves ni `.env` en el cambio; `backend/ecodet.db` no está versionado.
- ☐ Cada usuario ve solo su inmueble de demostración (RN-01), verificado a mano y con pruebas.
- ☐ Solo existe un inmueble de demostración por usuario, identificable y recargable (RN-16).
- ☐ Validaciones y mensajes coinciden con CU-08.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-27 y sus subtareas).
