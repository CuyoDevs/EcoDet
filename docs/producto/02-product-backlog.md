# Product Backlog · EcoDet
## Detector de anomalías en consumo del hogar · Base de trabajo
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 (20/10/2026) · **Product Owner:** Mateo · **Scrum Master:** Ari

---

## 1. Criterios de ordenación y estimación

- **Priorización MoSCoW:**
  - **Must have:** Imprescindible para el MVP (Release 1). Si falta, el producto no se puede usar.
  - **Should have:** Importante pero no crítico; si el tiempo aprieta, puede postergarse al siguiente sprint.
  - **Could have:** Deseable pero prescindible para la primera entrega.
- **Estimación en Story Points:** Escala Fibonacci modificada (1, 2, 3, 5, 8, 13). Referencia base de 1 punto: HU-04 (Cerrar sesión).
- **Alcance del MVP:** 21 historias de usuario agrupadas en 8 épicas (E0 a E7), cubriendo un total inicial de 90 puntos distribuidos en 2 sprints.

---

## 2. Mapa de Épicas del Release 1 (MVP)

| Clave | Épica | Descripción | Puntos |
| :--- | :--- | :--- | :--- |
| **E0** (DET-1) | **Base técnica** | Entorno de desarrollo, repositorio, base de datos y decisiones de arquitectura | 5 |
| **E1** (DET-2) | **Cuentas y acceso** | Registro, inicio de sesión y cierre de sesión de usuarios | 9 |
| **E2** (DET-3) | **Inmuebles** | Gestión de inmuebles (alta, edición y baja) asociados al usuario | 8 |
| **E3** (DET-4) | **Carga de lecturas** | Carga individual y por lote histórico de consumos (luz, gas, agua) | 16 |
| **E4** (DET-5) | **Historial y visualización** | Gráficos temporales de consumo y tablas históricas por servicio | 13 |
| **E5** (DET-6) | **Detección de anomalías** | Motor estadístico de evaluación de lecturas (estacionalidad y umbral) | 16 |
| **E6** (DET-7) | **Gestión de alertas** | Visualización, confirmación, marcado como normal y ajuste de umbral | 15 |
| **E7** (DET-8) | **Demostración y pruebas** | Carga de datos de ejemplo con anomalías simuladas | 8 |

---

## 3. Historias de Usuario detalladas

### Sprint 1: Base técnica, cuentas, inmuebles, carga de lecturas e historial (43 pts)

#### DET-9 · HU-01: Definir el stack y preparar el entorno (Must · 5 pts)
- **Como** equipo de desarrollo,
- **quiero** acordar las tecnologías, estructurar el repositorio y dejar corriendo el entorno base con la base de datos,
- **para** empezar a construir las funcionalidades del producto sobre una base común y verificada.
- **Criterios de Aceptación:**
  1. Queda escrita la decisión de backend, base de datos relacional y librería de gráficos en `ADR-001`.
  2. El repositorio tiene estructura base, README y el flujo de ramas con pull requests.
  3. Una pantalla mínima corre en la máquina de cada integrante y se conecta a la base.
  4. Los parámetros del sistema (mínimo de lecturas=6, umbral=2, piso=10%) quedan en un archivo de configuración fuera del código.

#### DET-10 · HU-02: Registrarme (Must · 5 pts)
- **Como** visitante,
- **quiero** crear una cuenta con mi correo y una contraseña segura,
- **para** acceder a la aplicación y gestionar mis consumos de forma privada.
- **Criterios de Aceptación:**
  1. Correo con formato válido y único; contraseña de al menos 8 caracteres con letras y números.
  2. Contraseña guardada cifrada (bcrypt); sesión iniciada automáticamente tras el registro.
  3. Panel de inicio vacío que invita a crear el primer inmueble.
  4. La cuenta nueva no ve datos de otros usuarios (aislamiento estricto, RN-01).

#### DET-11 · HU-03: Iniciar sesión (Must · 3 pts)
- **Como** usuario registrado,
- **quiero** ingresar con mi correo y contraseña,
- **para** acceder a mis inmuebles y consumos.
- **Criterios de Aceptación:**
  1. Con credenciales correctas entra al panel de inmuebles.
  2. Con credenciales erróneas muestra mensaje de error genérico.
  3. No permite acceso a datos de terceros.

#### DET-12 · HU-04: Cerrar sesión (Should · 1 pt)
- **Como** usuario con sesión activa,
- **quiero** cerrar mi sesión,
- **para** proteger mis datos si comparto la computadora.
- **Criterios de Aceptación:**
  1. Al hacer clic en "Cerrar sesión" se invalida la sesión y redirige al login.
  2. Intentar ingresar a rutas privadas sin sesión redirige al login.

#### DET-13 · HU-05: Crear un inmueble (Must · 3 pts)
- **Como** usuario,
- **quiero** dar de alta un inmueble con un nombre y opcionalmente su dirección,
- **para** agrupar las lecturas de mi casa o de otro lugar que administro.
- **Criterios de Aceptación:**
  1. Nombre obligatorio y único entre los inmuebles del mismo usuario.
  2. Aparece en la lista de inmuebles del usuario.

#### DET-14 · HU-06: Editar un inmueble (Should · 2 pts)
- **Como** usuario,
- **quiero** modificar el nombre y la dirección de un inmueble,
- **para** corregir errores o actualizar su información.
- **Criterios de Aceptación:**
  1. Valida unicidad y datos obligatorios.
  2. Las lecturas y alertas del inmueble no se modifican.

#### DET-16 · HU-08: Cargar una lectura de consumo (Must · 8 pts)
- **Como** usuario,
- **quiero** registrar el consumo de luz, gas o agua de un período determinado,
- **para** que el sistema lo incorpore al historial y lo evalúe.
- **Criterios de Aceptación:**
  1. Selección de servicio (luz en kWh, gas en m³, agua en m³ opcional). No se ingresa dinero.
  2. Fecha de fin no anterior a inicio ni posterior a hoy. Períodos sin superposición (RN-14).
  3. Consumo numérico $\ge 0$.

#### DET-17 · HU-09: Cargar facturas anteriores de una sola vez (Must · 8 pts)
- **Como** usuario que recién empieza a usar la aplicación,
- **quiero** cargar varias lecturas anteriores juntas,
- **para** tener historial suficiente y activar el detector sin esperar meses.
- **Criterios de Aceptación:**
  1. Carga histórica en lote con validación "todo o nada".
  2. Valida consistencia y ausencia de superposición en el lote y contra el historial.
  3. Al llegar a 6 o más lecturas, activa el detector.

#### DET-18 · HU-10: Ver historial y gráficos por servicio (Must · 8 pts)
- **Como** usuario,
- **quiero** ver la evolución de mi consumo en un gráfico por cada servicio,
- **para** entender cómo varía a lo largo del año.
- **Criterios de Aceptación:**
  1. Un gráfico por servicio ordenado cronológicamente.
  2. Muestra consumo por día y destaca lecturas con alerta.
  3. Detalle interactivo al seleccionar un punto.

---

### Sprint 2: Detección, alertas, retroalimentación y datos de demo (47 pts)
- **DET-15 · HU-07:** Eliminar un inmueble (Could · 3 pts)
- **DET-19 · HU-11:** Identificar lecturas anómalas en el historial (Must · 3 pts)
- **DET-20 · HU-12:** Evaluar el consumo considerando la estación del año (Must · 5 pts)
- **DET-21 · HU-13:** Ajustar la tolerancia con el umbral de desvíos (Must · 8 pts)
- **DET-22 · HU-14:** Recibir alertas de consumo inusual en la aplicación (Must · 5 pts)
- **DET-23 · HU-15:** Ver el detalle de una alerta (Must · 3 pts)
- **DET-24 · HU-16:** Confirmar una alerta (Should · 2 pts)
- **DET-25 · HU-17:** Marcar una alerta como normal para afinar futuras detecciones (Must · 3 pts)
- **DET-26 · HU-18:** Modificar el umbral de detección por servicio e inmueble (Should · 2 pts)
- **DET-27 · HU-19:** Cargar datos de ejemplo para probar el sistema (Should · 8 pts)
- **DET-28 · HU-20:** Probar la aplicación con facturas reales (Could · 2 pts)
- **DET-29 · HU-21:** Editar o eliminar una lectura cargada (Should · 3 pts)
