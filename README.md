# EcoDet · Detector de anomalías en consumo del hogar

Aplicación web donde el usuario registra su consumo de luz, gas y agua (en kWh o m³, nunca en dinero). El sistema aprende el patrón de cada inmueble y avisa cuando una lectura se aleja de lo normal, indicando servicio, período y desvío.

Proyecto del Taller de Tecnología Aplicada (implementación de Scrum con Jira). Alcance: Release 1 (MVP) en 2 sprints.

## Enlaces

- Repositorio: https://github.com/CuyoDevs/EcoDet
- Tablero de Jira: https://mateolujan13.atlassian.net/jira/software/projects/DET/boards/2
- Documentos del producto: Ver documentación en el repositorio (Objetivo del producto, Product Backlog, Documentación de apoyo)

## Equipo

| Rol | Integrante |
| --- | --- |
| Product Owner | Mateo |
| Scrum Master | Ari |
| Equipo de desarrollo | Josue, Gimena, Ari, Angel, William, Lisandro y Mateo |

## Calendario

- Sprint 1: 19/10/2026 al 02/11/2026
- Sprint 2: 02/11/2026 al 16/11/2026
- Presentación final: 30/11/2026

## Stack tecnológico

A definir en HU-01 (backend, base de datos relacional y librería de gráficos). Completar esta sección cuando se decida.

## Cómo correr el proyecto

`<completar en HU-01: requisitos, instalación, variables de entorno y comandos>`

## Parámetros del sistema

Viven en un archivo de configuración, no dentro del código:

- Mínimo de lecturas para generar alertas: 6
- Umbral inicial: 2 desvíos estándar
- Piso del desvío: 10 % del promedio

## Cómo trabajamos

El flujo de ramas, las reglas de pull request, la Definition of Ready y la Definition of Done están en [CONTRIBUTING.md](CONTRIBUTING.md).
