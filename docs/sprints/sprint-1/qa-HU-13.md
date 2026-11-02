# QA · HU-05 Crear un inmueble (DET-13)

> **Quién prueba:** alguien que **no** escribió el código de HU-05.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Hacen falta dos cuentas: registrar `laura@correo.com` (contraseña `Clave1234`) y `carlos@correo.com` (contraseña `Otra12345`) desde la pestaña **Registrarse**. Para repetir desde cero, borrar `backend/ecodet.db` con el backend detenido.
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación (los tres de HU-05)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Nombre válido.** Con la sesión iniciada, indico un nombre y, opcionalmente, una dirección → el inmueble se registra, queda asociado a mi usuario y aparece en mi lista. | 1. Entrar como Laura: se ve el panel vacío con la invitación a crear el primer inmueble.<br>2. Clic en **Nuevo inmueble**: se abre el formulario con los campos **Nombre del inmueble \*** y **Dirección (opcional)**, ambos con su etiqueta visible.<br>3. Escribir `Casa Norte` y `Ruta 40`, clic en **Guardar**: el formulario se cierra y aparece la tarjeta *Casa Norte* con su dirección.<br>4. **Recargar (F5):** el inmueble sigue en la lista.<br>5. Crear otro solo con nombre (`Casa de mamá`, sin dirección): aparece con "Sin dirección registrada".<br>6. Cerrar sesión, entrar como Carlos: su panel está vacío (no ve los inmuebles de Laura, RN-01). | `test_crear_inmueble_exito`, `test_listar_inmuebles_devuelve_los_del_usuario_en_orden`, `test_un_usuario_no_ve_los_inmuebles_de_otro`, `PanelInmuebles.test.jsx` | ☐ |
| 2 | **Nombre vacío o repetido.** El sistema pide corregirlo y no lo crea. | 1. Abrir el formulario y clic en **Guardar** sin escribir nada → **Ingresa un nombre para el inmueble.** debajo del campo, con ícono, y no se crea nada.<br>2. Escribir solo espacios → el mismo aviso.<br>3. Escribir `Casa Norte` (ya existe en Laura) → **Ya tienes un inmueble con este nombre.** debajo del campo; lo escrito se conserva y la lista no se duplica.<br>4. Cambiar el nombre a `Casa Sur` y guardar → se crea.<br>5. Entrar como Carlos y crear `Casa Norte` → **sí se permite** (el nombre solo debe ser único por usuario).<br>6. En la pestaña **Red** del navegador: con el nombre vacío no sale ninguna petición. | `test_crear_inmueble_nombre_vacio_da_error_422`, `test_crear_inmueble_duplicado_da_error_409`, `test_el_mismo_nombre_se_permite_en_otro_usuario`, `PanelInmuebles.test.jsx` | ☐ |
| 3 | **Más de un inmueble.** Puedo tener varios. | 1. Como Laura, tener al menos 3 inmuebles creados.<br>2. Verificar que se ven todos en la lista, en el orden en que se crearon, y siguen después de recargar. | `test_listar_inmuebles_devuelve_los_del_usuario_en_orden`, `PanelInmuebles.test.jsx` | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión.** No se pueden crear ni ver inmuebles. | 1. Cerrar sesión y abrir `http://localhost:5173/#/inmuebles`: se vuelve al acceso.<br>2. Abrir `http://localhost:8000/docs`, llamar a `GET` y `POST /api/inmuebles/` sin autorizar: responden 401. | `test_crear_inmueble_sin_token_da_error_401`, `test_listar_inmuebles_sin_token_da_error_401` | ☐ |
| B | **Cancelar.** Cancelar el formulario no crea nada y limpia los errores. | 1. Abrir el formulario, guardar vacío (aparece el error) y clic en **Cancelar**.<br>2. Volver a abrirlo: no queda ningún error y los campos están vacíos. | `PanelInmuebles.test.jsx` | ☐ |
| C | **Servidor caído.** Un fallo de conexión no se confunde con un error del nombre. | 1. Detener el backend, abrir el formulario, escribir un nombre y guardar.<br>2. Verificar el aviso general **No se pudo conectar con el servidor…** y que ningún campo queda marcado en rojo. | `PanelInmuebles.test.jsx` | ☐ |

## Registro de ejecución

> Lo completa quien hace QA al terminar. Marcar cada resultado con ☑ (pasa) o ☒ (falla); si falla, anotar en **Observaciones** el paso, lo que se esperaba y lo que pasó.

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-05) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD` en `main`) | |
| Navegador y sistema operativo | |
| `python -m pytest backend/tests/` (desde la raíz) | ☐ pasa — ___ pruebas |
| `npm test` (en `frontend`) | ☐ pasa — ___ pruebas |
| `npm run build` (en `frontend`) | ☐ compila |

**Observaciones:**

## Definition of Done del equipo

- ☐ El código está en GitHub y pasó por un pull request **revisado y aprobado por al menos un compañero** (nadie aprueba su propio PR).
- ☐ **Squash and merge** y rama borrada.
- ☐ `python -m pytest backend/tests/` pasa (desde la raíz del repo).
- ☐ `npm test` y `npm run build` pasan (dentro de `frontend`).
- ☐ No hay contraseñas, claves ni `.env` en el cambio (`git diff main --stat` y revisar). Ojo: `backend/ecodet.db` no debe estar versionado.
- ☐ Cada usuario ve solo sus propios inmuebles (RN-01), verificado a mano y con pruebas automáticas.
- ☐ Las validaciones y los mensajes de error coinciden con CU-03.
- ☐ El **Product Owner** aceptó el ticket y Jira pasó a **Hecho** (DET-13, DET-46, DET-47, DET-48 y DET-49).
