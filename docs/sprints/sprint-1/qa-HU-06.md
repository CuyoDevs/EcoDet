# QA · HU-06 Editar un inmueble (DET-14)

> **Quién prueba:** alguien que **no** escribió el código de HU-06.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura debe tener dos inmuebles: `Casa Norte` (`Ruta 40`) y `Depto` (sin dirección).
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).

## Criterios de aceptación (los tres de HU-06)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Datos válidos.** Modifico nombre y/o dirección y confirmo → los cambios se guardan. | 1. Como Laura, clic en el lápiz de *Casa Norte*: se abre el modal **Editar inmueble** con `Casa Norte` y `Ruta 40` ya cargados.<br>2. Cambiar a `Casa Sur` / `Ruta 7` y **Guardar cambios**: el modal se cierra y la tarjeta muestra los datos nuevos (sin duplicarse).<br>3. **Recargar (F5):** los cambios siguen.<br>4. Editar *Depto* y agregarle una dirección: se guarda.<br>5. Borrar la dirección de un inmueble y guardar: pasa a mostrar "Sin dirección registrada". | `test_editar_inmueble_exito_guarda_y_persiste`, `test_editar_inmueble_conservando_su_propio_nombre_no_da_409`, `PanelInmuebles.test.jsx` | ☐ |
| 2 | **Lecturas y alertas intactas.** Editar no modifica lecturas ni alertas. | 1. Con un inmueble que ya tenga lecturas cargadas (cuando esté HU-08), anotar sus lecturas y alertas.<br>2. Editar nombre y dirección.<br>3. Verificar que lecturas y alertas son exactamente las mismas. | `test_editar_inmueble_no_modifica_lecturas_ni_alertas` | ☐ |
| 3 | **Mismas validaciones que al crear.** | 1. Editar *Casa Norte*, borrar el nombre y guardar → **Ingresa un nombre para el inmueble.** debajo del campo; no sale petición en la pestaña **Red**.<br>2. Escribir solo espacios → el mismo aviso.<br>3. Editar *Depto* y ponerle `Casa Sur` (ya existe) → **Ya tienes otro inmueble con este nombre.** debajo del campo; lo escrito se conserva y la lista no cambia.<br>4. Guardar *Casa Sur* sin cambiar el nombre (solo la dirección) → se guarda, sin error de duplicado.<br>5. Como Carlos, editar un inmueble propio con el nombre `Casa Sur` → **sí se permite** (único por usuario). | `test_editar_inmueble_nombre_de_otro_inmueble_propio_da_409`, `test_editar_inmueble_nombre_vacio_da_422_y_no_modifica`, `PanelInmuebles.test.jsx` | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión / de otro usuario (RN-01).** | 1. En `http://localhost:8000/docs`, `PUT /api/inmuebles/{id}` sin autorizar → 401.<br>2. Autorizado como Carlos, `PUT` con el `id` de un inmueble de Laura → 404 y el inmueble de Laura no cambia. | `test_editar_inmueble_sin_token_da_401`, `test_editar_inmueble_de_otro_usuario_da_404_y_no_lo_modifica`, `test_editar_inmueble_inexistente_da_404` | ☐ |
| B | **Cancelar.** | 1. Abrir el modal, borrar el nombre, guardar (aparece el error) y **Cancelar** (o `Esc`).<br>2. Reabrirlo: sin errores y con los datos originales. | `PanelInmuebles.test.jsx` | ☐ |
| C | **Servidor caído.** | 1. Detener el backend, abrir el modal y guardar.<br>2. Aviso general **No se pudo conectar con el servidor…** dentro del modal y ningún campo en rojo. | `PanelInmuebles.test.jsx` | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-06) | |
| Fecha | |
| Versión probada (`git rev-parse --short HEAD` en `main`) | |
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
- ☐ Cada usuario edita solo sus propios inmuebles (RN-01), verificado a mano y con pruebas.
- ☐ Validaciones y mensajes coinciden con CU-03.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-14, DET-50, DET-51, DET-52 y DET-53).
