# QA · HU-07 Eliminar un inmueble (DET-15)

> **Quién prueba:** alguien que **no** escribió el código de HU-07.
> **Antes de empezar:** backend en `:8000` y frontend en `:5173` (ver README). Registrar `laura@correo.com` (`Clave1234`) y `carlos@correo.com` (`Otra12345`). Laura debe tener dos inmuebles: `Casa Norte` (`Ruta 40`) y `Depto` (sin dirección), **cada uno con al menos 2 lecturas de luz cargadas** (botón **+ Cargar consumo**).
> La columna "Auto" indica si el criterio ya está cubierto por una prueba automática; **igual se prueba a mano** (el DoD lo exige).
> **Qué se borra:** `DELETE /api/inmuebles/{id}` elimina el inmueble con sus lecturas, alertas y umbrales, y responde `204` sin cuerpo.

## Criterios de aceptación (los cuatro de HU-07)

| # | Dado / Cuando / Entonces | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| 1 | **Advertencia y confirmación.** Con un inmueble seleccionado, al elegir "Eliminar" el sistema advierte que también se borrarán sus lecturas y alertas y pide confirmación. | 1. Como Laura, clic en el ícono de papelera de *Casa Norte*.<br>2. Se abre el aviso **Eliminar inmueble**: nombra a `Casa Norte` y dice que **también se borrarán todas sus lecturas y alertas** y que no se puede deshacer.<br>3. Tiene dos botones: **Cancelar** y **Sí, eliminar**.<br>4. Con el aviso abierto, la tarjeta sigue en la lista: todavía no se borró nada. | `test_eliminar_inmueble_exito_da_204_y_desaparece_de_la_lista`, `PanelInmuebles.test.jsx` (*criterio 1*) | ☐ |
| 2 | **Se elimina con todos sus datos.** Si confirmo, se elimina el inmueble con todos sus datos asociados. | 1. En el aviso de *Casa Norte*, clic en **Sí, eliminar**: el aviso se cierra y la tarjeta desaparece; *Depto* sigue.<br>2. **Recargar (F5):** *Casa Norte* no vuelve.<br>3. En `http://localhost:8000/docs`, autorizado como Laura, `GET /api/consumos/{id}/historial` con el `id` de *Casa Norte* → 404.<br>4. En la app, **Ver historial** de *Depto*: conserva sus lecturas.<br>5. (Opcional) `sqlite3 backend/ecodet.db "SELECT COUNT(*) FROM lecturas WHERE inmueble_id = <id de Casa Norte>"` → `0`.<br>6. Crear de nuevo un inmueble llamado `Casa Norte`: se permite (el nombre quedó libre). | `test_eliminar_inmueble_borra_en_cascada_lecturas_alertas_y_umbrales`, `test_eliminar_inmueble_no_toca_los_datos_de_otros_inmuebles`, `test_se_puede_recrear_un_inmueble_con_el_nombre_de_uno_eliminado`, `PanelInmuebles.test.jsx` (*criterio 2*) | ☐ |
| 3 | **Cancelar no borra nada.** Si cancelo, salgo de la confirmación y no se elimina nada. | 1. Clic en la papelera de *Depto* y luego en **Cancelar**: el aviso se cierra y *Depto* sigue en la lista.<br>2. Repetir y cerrar con la tecla `Esc`: igual.<br>3. **Recargar (F5):** *Depto* y sus lecturas siguen. | `PanelInmuebles.test.jsx` (*criterio 3*) | ☐ |
| 4 | **Sirve para el inmueble de demostración (HU-19).** | 1. Cuando HU-19 esté en `main`: cargar los datos de ejemplo, clic en la papelera de *Demo (ejemplo)* y confirmar → desaparece con sus lecturas y alertas.<br>2. Verificar que se puede volver a cargar (RN-16). | `test_eliminar_inmueble_de_demostracion` | ☐ |

## Comprobaciones de apoyo

| # | Qué se comprueba | Pasos a mano | Auto | Resultado |
| :-: | :--- | :--- | :-: | :-: |
| A | **Sin sesión / de otro usuario (RN-01).** | 1. En `http://localhost:8000/docs`, `DELETE /api/inmuebles/{id}` sin autorizar → 401.<br>2. Autorizado como Carlos, `DELETE` con el `id` de un inmueble de Laura → 404 y el inmueble de Laura sigue con sus lecturas. | `test_eliminar_inmueble_sin_token_da_401`, `test_eliminar_inmueble_de_otro_usuario_da_404_y_no_lo_borra` | ☐ |
| B | **Inexistente o ya eliminado.** | 1. `DELETE` con un `id` que no existe (ej. `9999`) → 404 `Inmueble no encontrado.`.<br>2. `DELETE` dos veces seguidas sobre el mismo `id` → 204 la primera y 404 la segunda. | `test_eliminar_inmueble_inexistente_da_404`, `test_eliminar_inmueble_dos_veces_da_404_la_segunda` | ☐ |
| C | **Servidor caído.** | 1. Detener el backend, abrir el aviso de un inmueble y clic en **Sí, eliminar**.<br>2. Aviso **No se pudo conectar con el servidor…** dentro del aviso, y el inmueble sigue en la lista.<br>3. Cancelar y reabrir: el aviso aparece sin el error. | `PanelInmuebles.test.jsx` | ☐ |
| D | **Sin doble envío.** | 1. En la pestaña **Red** de las herramientas del navegador, activar throttling "Slow 3G".<br>2. Clic en **Sí, eliminar**: el botón pasa a **Eliminando…** y tanto él como **Cancelar** quedan deshabilitados; sale una sola petición `DELETE`. | `PanelInmuebles.test.jsx` | ☐ |
| E | **Último inmueble.** | 1. Con un usuario que tenga un solo inmueble, eliminarlo.<br>2. El panel vuelve a mostrar el estado vacío (*Todavía no tienes ningún inmueble*). | `PanelInmuebles.test.jsx` | ☐ |

## Registro de ejecución

| Dato | Valor |
| :--- | :--- |
| Quién probó (no escribió el código de HU-07) | |
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
- ☐ Cada usuario elimina solo sus propios inmuebles (RN-01), verificado a mano y con pruebas.
- ☐ Validaciones y mensajes coinciden con CU-03.
- ☐ El **Product Owner** aceptó el ticket y Jira quedó en **Hecho** (DET-15, DET-69, DET-70, DET-71 y DET-72).
