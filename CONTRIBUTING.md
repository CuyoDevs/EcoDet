# Cómo trabajamos

## Flujo de ramas

- `main` es la única rama permanente. Siempre debe estar estable y **nadie hace push directo**: todo entra por pull request.
- Cada ticket de Jira se trabaja en su propia rama, creada desde `main` actualizada.
- Nombre de la rama: `DET-<número>-descripcion-corta`, por ejemplo `DET-5-crear-inmueble`.
- Commits que empiezan con la clave del ticket: `DET-5 valida nombre repetido`. Así Jira los vincula solo.
- Una rama = un ticket. Ramas cortas: se mergean en cuanto el ticket cumple el DoD.

## Pull requests

1. Subir la rama y abrir el pull request hacia `main`, completando la plantilla.
2. El ticket de Jira pasa a **En revisión**.
3. Al menos **1 compañero** revisa y aprueba. Nadie aprueba su propio PR.
4. Si hay comentarios, se corrigen en la misma rama y se vuelve a pedir revisión.
5. Con la aprobación, se hace **Squash and merge** y se borra la rama.
6. El Product Owner revisa y acepta el ticket; recién ahí pasa a **Hecho**.

## Definition of Ready (DoR)

Una historia entra al Sprint Planning cuando:

- Tiene el formato "Como [perfil], quiero [objetivo], para [beneficio]".
- Tiene criterios de aceptación claros y verificables.
- Indica los casos de uso y reglas de negocio que aplica.
- Sus dependencias están identificadas y no hay nada que la bloquee.
- Fue estimada por los desarrolladores y tiene 8 puntos o menos.
- Tiene un wireframe de referencia si incluye interfaz.
- Entra completa en un sprint de 2 semanas.

## Definition of Done (DoD)

Un ítem está terminado cuando:

- El código está en GitHub y pasó por un pull request revisado por al menos un compañero.
- Cumple todos sus criterios de aceptación, probados en el camino principal y en los alternativos.
- La lógica del detector (HU-12 y HU-13) tiene pruebas automáticas con los casos de prueba del documento.
- Funciona en el entorno de demostración, sin errores críticos conocidos.
- Las validaciones y los mensajes de error coinciden con los casos de uso.
- Cada usuario ve solo sus propios datos (se verificó donde corresponde).
- El Product Owner lo revisó y lo aceptó.
- El ticket de Jira está en "Hecho" y el README o la ayuda están actualizados si hacía falta.

## Etiquetas

`Must`, `Should` y `Could` indican la prioridad MoSCoW de cada historia. `bug` marca errores.

## Reglas generales

- Nunca subir contraseñas, claves ni archivos `.env` (el repositorio es público).
- Los parámetros del sistema van en el archivo de configuración.
- Antes de empezar un ticket: `git checkout main && git pull`.
