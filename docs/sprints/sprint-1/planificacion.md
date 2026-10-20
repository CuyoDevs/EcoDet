# EcoDet · Planificación del Sprint 1 y Sprint Backlog
## Detector de anomalías en consumo del hogar · Release 1 (MVP)
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 · **Fecha:** 20/10/2026 · **Product Owner:** Mateo · **Scrum Master:** Ari

---

## 1. Datos generales

| Dato | Detalle |
| :--- | :--- |
| **Proyecto** | EcoDet · Detector de anomalías en consumo del hogar |
| **Sprint** | Sprint 1 (`DET Sprint 1` en Jira) |
| **Duración** | 2 semanas: 19/10/2026 al 02/11/2026 |
| **Sprint Review** | 02/11/2026 |
| **Tablero Jira** | https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2 |
| **Repositorio** | https://github.com/CuyoDevs/EcoDet |

### Participantes y Roles
- **Product Owner:** Mateo
- **Scrum Master:** Ari
- **Desarrolladores:** Josue, Gimena, Ari, Angel, William, Lisandro, Mateo

---

## 2. Sprint Goal (Objetivo del Sprint)
> **"Base técnica, cuentas, inmuebles, carga de lecturas e historial con gráficos."**

### Criterios de cumplimiento del objetivo:
1. El stack tecnológico está decidido y registrado en `ADR-001`, y el entorno base corre en la máquina de cada integrante.
2. Una persona puede registrarse, iniciar sesión y cerrar sesión.
3. Puede crear y editar inmuebles.
4. Puede cargar lecturas de luz, gas y agua (opcional), de a una y en lote histórico, con las validaciones de los casos de uso.
5. Puede ver un gráfico por servicio para cada inmueble.

---

## 3. Sprint Backlog (Elementos seleccionados)

| Orden | Clave | HU | Título | Prioridad | Puntos | Depende de | Wireframe |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | **DET-9** | HU-01 | Definir el stack y preparar el entorno | Must | 5 | — | — |
| 2 | **DET-10** | HU-02 | Registrarme | Must | 5 | HU-01 | W1 |
| 3 | **DET-11** | HU-03 | Iniciar sesión | Must | 3 | HU-02 | W1 |
| 4 | **DET-12** | HU-04 | Cerrar sesión | Should | 1 | HU-03 | W1 |
| 5 | **DET-13** | HU-05 | Crear un inmueble | Must | 3 | HU-03 | W2 |
| 6 | **DET-14** | HU-06 | Editar un inmueble | Should | 2 | HU-05 | W2 |
| 7 | **DET-16** | HU-08 | Cargar una lectura de consumo | Must | 8 | HU-05 | W3 |
| 8 | **DET-17** | HU-09 | Cargar facturas anteriores de una sola vez | Must | 8 | HU-08 | W3 |
| 9 | **DET-18** | HU-10 | Ver historial y gráficos por servicio | Must | 8 | HU-08 | W4 |

**Total:** 9 historias de usuario · **43 puntos** (7 Must con 40 pts, 2 Should con 3 pts).

---

## 4. Dependencias y Camino Crítico
$$\text{HU-01} \longrightarrow \text{HU-02} \longrightarrow \text{HU-03} \longrightarrow \text{HU-05} \longrightarrow \text{HU-08} \longrightarrow \text{HU-10}$$
Este camino encadenado suma **32 puntos**. Para mitigar cuellos de botella:
- Mientras se completan los endpoints del backend, los desarrolladores de frontend avanzan con las pantallas W1 a W4 usando componentes mockeados.
- Si el sprint se complica, según MoSCoW se postergan primero las historias Should: HU-04 (1 pt) y HU-06 (2 pts).
