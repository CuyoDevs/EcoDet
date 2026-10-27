# EcoDet · Sprint Backlog del Sprint 1
## Elementos seleccionados, estimaciones, dependencias y riesgos
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 · **Fecha:** 20/10/2026 · **Product Owner:** Mateo · **Scrum Master:** Ari

---

## 1. Elementos seleccionados (Sprint Backlog)

Total comprometido: **9 historias de usuario** y **43 puntos de historia** (7 Must con 40 pts y 2 Should con 3 pts).

| Orden | Clave | HU | Título | Prioridad | Pts | Depende de | Caso de Uso | Reglas de Negocio | Wireframe |
| :---: | :---: | :---: | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| 1 | **DET-9** | HU-01 | Definir el stack y preparar el entorno | Must | 5 | — | — | — | — |
| 2 | **DET-10** | HU-02 | Registrarme | Must | 5 | HU-01 | CU-01 | RN-01, RN-15 | W1 |
| 3 | **DET-11** | HU-03 | Iniciar sesión | Must | 3 | HU-02 | CU-02 | RN-01 | W1 |
| 4 | **DET-12** | HU-04 | Cerrar sesión | Should | 1 | HU-03 | CU-10 | RN-01 | W1 |
| 5 | **DET-13** | HU-05 | Crear un inmueble | Must | 3 | HU-03 | CU-03 | RN-01 | W2 |
| 6 | **DET-14** | HU-06 | Editar un inmueble | Should | 2 | HU-05 | CU-03 | RN-01 | W2 |
| 7 | **DET-16** | HU-08 | Cargar una lectura de consumo | Must | 8 | HU-05 | CU-04 | RN-02, 03, 04, 05, 14 | W3 |
| 8 | **DET-17** | HU-09 | Cargar facturas anteriores de una sola vez | Must | 8 | HU-08 | CU-04 (lote) | RN-07, RN-14 | W3 |
| 9 | **DET-18** | HU-10 | Ver historial y gráficos por servicio | Must | 8 | HU-08 | CU-05 | RN-04, RN-06 | W4 |

---

## 2. Camino Crítico y Dependencias

$$\text{HU-01} \longrightarrow \text{HU-02} \longrightarrow \text{HU-03} \longrightarrow \text{HU-05} \longrightarrow \text{HU-08} \longrightarrow \text{HU-10}$$

- **Largo del camino crítico:** 6 historias encadenadas que suman **32 puntos**.
- **Estrategia para evitar cuellos de botella:**
  - Mientras el backend implementa endpoints de base de datos y autenticación, los desarrolladores de frontend construyen las pantallas **W1 a W4** en React con componentes visuales y datos simulados (mock data).
  - Al estar listos los endpoints, se conectan sin fricción.
- **Gestión de alcance (MoSCoW):**
  - Si surgen atrasos hacia el final del sprint, las historias *Should* son las primeras en postergarse al Sprint 2 o Release 2: primero **HU-04** (1 pt) y luego **HU-06** (2 pts). Las historias *Must* no se recortan.

---

## 3. Criterios de Aceptación por Historia

### HU-01 · Definir el stack y preparar el entorno (DET-9)
1. Decisión de stack documentada en `ADR-001`.
2. Repositorio configurado con estructura base `/backend` y `/frontend`, README e instrucciones.
3. Pantalla mínima corriendo en la máquina de cada integrante conectada a la base de datos SQLite.
4. Parámetros del sistema en archivo de configuración (`backend/config.json`) fuera del código.

### HU-02 · Registrarme (DET-10)
1. Correo con formato válido y único; contraseña de al menos 8 caracteres con letras y números.
2. Contraseña guardada cifrada (bcrypt); sesión iniciada automáticamente.
3. Panel de inicio vacío que invita a crear el primer inmueble.
4. La cuenta nueva no ve datos de otros usuarios (RN-01).

### HU-03 · Iniciar sesión (DET-11)
1. Credenciales correctas: muestra panel con inmuebles.
2. Credenciales incorrectas: mensaje de error genérico.
3. Campos vacíos: validación debajo de cada campo.

### HU-04 · Cerrar sesión (DET-12)
1. Al elegir "Cerrar sesión" se destruye el token/sesión y se vuelve al login.
2. Intentar acceder a rutas privadas sin sesión redirige automáticamente al login.

### HU-05 · Crear un inmueble (DET-13)
1. Nombre obligatorio y único entre los inmuebles del mismo usuario. Dirección opcional.
2. Se asocia al usuario logueado y se lista en el panel principal.

### HU-06 · Editar un inmueble (DET-14)
1. Permite modificar nombre y dirección con las mismas validaciones de alta.
2. Las lecturas y alertas existentes del inmueble no sufren modificaciones.

### HU-08 · Cargar una lectura de consumo (DET-16)
1. Selección de servicio (luz en kWh, gas en m³, agua en m³ opcional). Unidad fija, nunca dinero.
2. Fecha de fin no anterior a inicio ni posterior a hoy. Sin superposición con períodos existentes (RN-14).
3. Consumo numérico $\ge 0$.
4. Funciona con luz y gas sin fallar si no hay datos de agua (RN-04).

### HU-09 · Cargar facturas anteriores de una sola vez (DET-17)
1. Interfaz de carga histórica en lote con múltiples filas.
2. Validación "todo o nada": si una fila falla o se superpone, no se guarda ninguna y se indica el error exacto.
3. Si el lote supera 6 lecturas, deja al detector activo para ese servicio.

### HU-10 · Ver historial y gráficos por servicio (DET-18)
1. Un gráfico por servicio ordenado cronológicamente.
2. Destaque visual en puntos con anomalías.
3. Detalle interactivo al hacer clic en un punto (período, consumo total y consumo por día).
4. Estado vacío informativo cuando el inmueble no tiene lecturas cargadas.
