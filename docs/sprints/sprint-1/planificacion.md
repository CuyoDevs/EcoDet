# EcoDet · Planificación del Sprint 1 (Sprint Planning)
## Detector de anomalías en consumo del hogar · Release 1 (MVP)
**Taller de Tecnología Aplicada · Proyecto: Implementación de Scrum con Jira**  
**Versión:** 1.0 · **Fecha:** 20/10/2026 · **Product Owner:** Mateo · **Scrum Master:** Ari

---

## 1. Datos generales del Sprint

| Dato | Detalle |
| :--- | :--- |
| **Proyecto** | EcoDet · Detector de anomalías en consumo del hogar |
| **Sprint** | Sprint 1 (`DET Sprint 1` en Jira) |
| **Duración** | 2 semanas: 19/10/2026 al 02/11/2026 (10 días hábiles) |
| **Sprint Review** | 02/11/2026 |
| **Sprint Retrospective** | 02/11/2026 |
| **Tablero Jira** | https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2 |
| **Repositorio** | https://github.com/CuyoDevs/EcoDet |

### Participantes y Roles
- **Product Owner:** Mateo
- **Scrum Master:** Ari
- **Desarrolladores:** Josue, Gimena, Ari, Angel, William, Lisandro, Mateo

---

## 2. Tema 1 · ¿Por qué es valioso este Sprint?

### Propuesta del Product Owner
Al terminar el Sprint 1, una persona puede registrarse, iniciar sesión, crear sus inmuebles, cargar lecturas de luz, gas y agua (de a una o varias facturas anteriores de una sola vez) y ver cómo evoluciona su consumo en un gráfico por servicio. Es la base técnica y de datos sobre la que el Sprint 2 construirá el motor estadístico del detector y las alertas.

### Objetivo del Sprint (Sprint Goal)
> **"Base técnica, cuentas, inmuebles, carga de lecturas e historial con gráficos."**

### Criterios de cumplimiento del Sprint Goal:
1. El stack tecnológico está decidido y registrado en `ADR-001`, y el entorno base corre en la máquina de cada integrante.
2. Una persona puede registrarse, iniciar sesión y cerrar sesión de forma segura (RN-01, RN-15).
3. Puede crear y editar inmuebles.
4. Puede cargar lecturas de luz, gas y agua (opcional), de forma individual y en lote histórico, con las validaciones de negocio.
5. Puede ver un gráfico interactivo por servicio para cada inmueble.

---

## 3. Acuerdos de trabajo del Equipo

- **Flujo Git y Ramas:** 
  - Nomenclatura obligatoria: `DET-<n>-descripcion-corta` (ej.: `DET-10-registro-usuario`).
  - Commits con prefijo de ticket: `DET-<n>: descripción clara`.
  - La rama `main` está protegida: todo entra por Pull Request con al menos 1 aprobación de un compañero y squash merge.
- **Definición de Terminado (DoD):**
  - Código con tipado y validaciones de Pydantic.
  - Pruebas automáticas pasando con `pytest`.
  - Sin credenciales ni secretos en el repositorio (DoD de seguridad).
  - Aceptación funcional del Product Owner.
- **Gestión de reuniones:**
  - **Daily Scrum:** 15 minutos en horario acordado.
  - **Refinamiento de mitad de sprint:** Alrededor del 27/10 para dejar listas las historias del Sprint 2.
  - **Review y Retro:** 02/11/2026.
