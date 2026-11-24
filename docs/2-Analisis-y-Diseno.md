# EcoDet · Documentación de Análisis y Diseño
## Taller de Tecnología Aplicada (EGI) · Release 1 (MVP) — Sprints 1 y 2

**Cátedra:** Taller de Tecnología Aplicada (EGI)  
**Proyecto:** EcoDet — Detector de anomalías en consumo del hogar (Luz, Gas y Agua)  
**Equipo:** CuyoDevs  
**Fecha de Presentación:** Miércoles 25/11/2026  
**Repositorio GitHub:** [https://github.com/CuyoDevs/EcoDet](https://github.com/CuyoDevs/EcoDet)  
**Versión del documento:** 2.0 (Refinada tras el cierre del Sprint 2)

---

# PARTE 1 · Diagrama de Casos de Uso

## 1.1. Actores del Sistema

| Actor | Tipo | Descripción |
| :--- | :--- | :--- |
| **Visitante** | Externo primario | Persona no registrada que puede registrarse o iniciar sesión. |
| **Usuario Autenticado** | Externo primario | Persona con cuenta activa que gestiona inmuebles, carga lecturas y consulta alertas. |
| **Motor del Sistema** | Interno (automatizado) | Módulo `detector.py` que evalúa lecturas y emite alertas sin intervención humana. |

---

## 1.2. Diagrama General de Casos de Uso (Mermaid)

```mermaid
flowchart LR
    subgraph Actores
        V["👤 Visitante"]
        U["👤 Usuario Autenticado"]
        S["⚙️ Motor del Sistema"]
    end

    subgraph CasosDeUso["Casos de Uso del Sistema EcoDet (MVP)"]
        %% Autenticación y Cuentas
        CU01(["CU-01 Registrarse (HU-02)"])
        CU02(["CU-02 Iniciar sesión (HU-03)"])
        CU03(["CU-03 Cerrar sesión (HU-04)"])
        CU04(["CU-04 Consultar mi perfil (HU-04)"])

        %% Gestión de Inmuebles
        CU05(["CU-05 Gestionar inmuebles (Alta / Edición / Eliminación) (HU-05, HU-06, HU-07)"])

        %% Carga de Consumos
        CU06(["CU-06 Cargar lectura individual (HU-08)"])
        CU07(["CU-07 Cargar facturas en lote histórico (HU-09)"])
        CU08(["CU-08 Editar o eliminar lectura existente (HU-11)"])
        CU09(["CU-09 Cargar datos demo de ejemplo (HU-19)"])

        %% Detección y Estadísticas
        CU10(["CU-10 Evaluar consumo y detectar anomalías (HU-12)"])
        CU11(["CU-11 Visualizar estado de aprendizaje y progreso (HU-14)"])
        CU12(["CU-12 Consultar historial y franja habitual (HU-10, HU-21)"])

        %% Alertas y Umbrales
        CU13(["CU-13 Gestionar panel de alertas (HU-15)"])
        CU14(["CU-14 Marcar alerta como normal (HU-16)"])
        CU15(["CU-15 Confirmar alerta como anómala (HU-17)"])
        CU16(["CU-16 Ajustar sensibilidad de umbrales (HU-18)"])
    end

    %% Relaciones de Visitante
    V --> CU01
    V --> CU02

    %% Relaciones de Usuario
    U --> CU03
    U --> CU04
    U --> CU05
    U --> CU06
    U --> CU07
    U --> CU08
    U --> CU09
    U --> CU11
    U --> CU12
    U --> CU13
    U --> CU16

    %% Dependencias Include y Extend
    CU06 -.->|«include»| CU10
    CU07 -.->|«include»| CU10
    CU08 -.->|«include»| CU10
    CU09 -.->|«include»| CU10

    CU14 -.->|«extend»| CU13
    CU15 -.->|«extend»| CU13
    CU11 -.->|«include»| CU12

    %% Actor Sistema
    S --> CU10
```

---

## 1.3. Descripción Detallada de Casos de Uso

| ID | Caso de Uso | Actor Principal | Historias Asociadas | Descripción y Reglas de Negocio |
| :--- | :--- | :--- | :--- | :--- |
| **CU-01** | Registrarse | Visitante | HU-02 (DET-10) | Permite crear una cuenta nueva con nombre, correo único y contraseña cifrada con `bcrypt` (RN-01, RN-15). |
| **CU-02** | Iniciar sesión | Visitante | HU-03 (DET-11) | Valida credenciales y emite un token JWT con expiración configurable (RN-15). |
| **CU-03** | Cerrar sesión | Usuario | HU-04 (DET-12) | Revoca el token en el cliente y redirige a la pantalla pública de bienvenida. |
| **CU-04** | Consultar perfil | Usuario | HU-04 (DET-12) | Obtiene los datos del usuario logueado mediante `GET /api/auth/me`. |
| **CU-05** | Gestionar inmuebles | Usuario | HU-05, HU-06, HU-07 (DET-13, 14, 15) | Alta, edición de nombre/dirección y **eliminación con borrado en cascada** de lecturas y alertas vinculadas. |
| **CU-06** | Cargar lectura individual | Usuario | HU-08 (DET-16) | Registra una lectura con fecha de inicio, fin y consumo en unidad física (kWh/m³). Prorratea el consumo por día (RN-02, RN-03). Dispara CU-10. |
| **CU-07** | Carga histórica en lote | Usuario | HU-09 (DET-17) | Permite ingresar múltiples facturas pasadas en una sola operación atómica (todo-o-nada). Dispara CU-10. |
| **CU-08** | Editar o eliminar lectura | Usuario | HU-11 (DET-19) | Modifica fechas/consumo o suprime una lectura. Reevalúa inmediatamente la alerta asociada (RN-17). Dispara CU-10. |
| **CU-09** | Cargar datos demo | Usuario | HU-19 (DET-27) | Pobla el inmueble con facturas de prueba y curvas estacionales para evaluación del sistema. |
| **CU-10** | Detectar anomalías | Sistema | HU-12, HU-13 (DET-20, 21) | Motor estadístico: verifica si hay ≥ 6 lecturas (RN-07), calcula estacionalidad (RN-08), límites µ ± (k × σ) (RN-09/10), aplica piso del 10% (RN-12) y emite alertas ALTA/BAJA en estado PENDIENTE. |
| **CU-11** | Ver estado de aprendizaje | Usuario | HU-14 (DET-22) | Muestra si el detector está aprendiendo (< 6 lecturas), indicando exactamente cuántas facturas faltan mediante barra de progreso interactiva. |
| **CU-12** | Consultar historial y franja | Usuario | HU-10, HU-21 (DET-18, 29) | Gráficos Chart.js interactivos por servicio con tooltips y sombreado de la franja de consumo habitual entre límite inferior y superior. |
| **CU-13** | Gestionar panel de alertas | Usuario | HU-15 (DET-23) | Muestra la lista de alertas pendientes/resueltas con filtros por servicio y estado, indicando el desvío porcentual. |
| **CU-14** | Marcar alerta como normal | Usuario | HU-16 (DET-24) | El usuario indica que el consumo atípico tuvo causa justificada. Cambia estado a `NORMAL` y se **excluye de cálculos futuros** (RN-11). |
| **CU-15** | Confirmar alerta | Usuario | HU-17 (DET-25) | El usuario confirma que la anomalía fue una pérdida o fuga real. Cambia estado a `CONFIRMADA`. |
| **CU-16** | Ajustar sensibilidad | Usuario | HU-18 (DET-26) | Permite modificar el umbral k de desvíos estándar (entre 1.0 y 3.0) de forma independiente por inmueble y servicio. |

---

---

# PARTE 2 · Diagrama de Clases del Dominio

## 2.1. Diagrama de Clases (Mermaid)

```mermaid
classDiagram
    %% ==========================================
    %% Entidades Principales
    %% ==========================================
    class Usuario {
        +int id
        +string nombre
        +string correo
        +string contrasena_hash
        +datetime created_at
        +inmuebles: List~Inmueble~
        +verificar_contrasena(plain_password) bool
    }

    class Inmueble {
        +int id
        +int usuario_id
        +string nombre
        +string direccion
        +bool es_demo
        +lecturas: List~Lectura~
        +umbrales: List~UmbralServicio~
        +alertas_pendientes_conteo(servicio) int
        +lecturas_por_servicio(servicio) List~Lectura~
    }

    class Lectura {
        +int id
        +int inmuebleId
        +ServicioEnum servicio
        +date fecha_inicio
        +date fecha_fin
        +float consumo
        +float consumo_por_dia
        +alerta: Alerta
        +dias_del_periodo() int
        +calcular_consumo_por_dia() float
        +estacion() EstacionEnum
        +punto_medio() date
    }

    class Alerta {
        +int id
        +int lectura_id
        +TipoAlertaEnum tipo
        +EstadoAlertaEnum estado
        +float desvio_porcentual
        +float consumo_por_dia
        +float consumo_habitual_por_dia
        +datetime fecha_creacion
        +marcar_como_normal() void
        +confirmar_anomalia() void
        +es_excluida_de_calculos() bool
    }

    class UmbralServicio {
        +int id
        +int inmueble_id
        +ServicioEnum servicio
        +float umbral
        +actualizar_umbral(nuevo_valor) void
    }

    %% ==========================================
    %% Enumeraciones
    %% ==========================================
    class ServicioEnum {
        <<enumeration>>
        LUZ
        GAS
        AGUA
    }

    class TipoAlertaEnum {
        <<enumeration>>
        ALTA
        BAJA
    }

    class EstadoAlertaEnum {
        <<enumeration>>
        PENDIENTE
        CONFIRMADA
        NORMAL
    }

    class EstacionEnum {
        <<enumeration>>
        VERANO
        OTONO
        INVIERNO
        PRIMAVERA
    }

    %% ==========================================
    %% Motor Estadístico del Sistema
    %% ==========================================
    class DetectorAnomalias {
        +int minimo_de_lecturas = 6
        +float umbral_inicial_en_desvios = 2.0
        +float piso_del_desvio_porcentaje = 10.0
        +consumo_por_dia(consumo, dias) float
        +estacion_de(fecha) EstacionEnum
        +punto_medio(fecha_inicio, fecha_fin) date
        +seleccionar_referencia(historial, estacion) Tuple
        +calcular_limites(referencia, umbral, piso) Tuple
        +evaluar_lectura(lectura, historial, umbral) ResultadoEvaluacion
    }

    class ResultadoEvaluacion {
        +string estado "aprendiendo | dentro | alta | baja"
        +float consumo_por_dia
        +float promedio
        +float desvio_efectivo
        +float limite_inferior
        +float limite_superior
        +float desvio_porcentual
        +int cantidad_referencia
        +bool referencia_estacional
        +string motivo
        +string mensaje
    }

    %% ==========================================
    %% Relaciones y Cardinalidades
    %% ==========================================
    Usuario "1" *-- "0..*" Inmueble : posee (cascade delete)
    Inmueble "1" *-- "0..*" Lectura : registra (cascade delete)
    Inmueble "1" *-- "0..*" UmbralServicio : personaliza
    Lectura "1" o-- "0..1" Alerta : genera (1 a 0..1)

    Lectura ..> ServicioEnum : clasifica
    Lectura ..> EstacionEnum : calcula
    Alerta ..> TipoAlertaEnum : tipifica
    Alerta ..> EstadoAlertaEnum : registra estado
    UmbralServicio ..> ServicioEnum : aplica a

    DetectorAnomalias ..> Lectura : evalúa historial
    DetectorAnomalias ..> UmbralServicio : consulta umbral
    DetectorAnomalias ..> ResultadoEvaluacion : produce
    Alerta ..> ResultadoEvaluacion : se origina de
```

---

## 2.2. Descripción de Clases y Responsabilidades

### 2.2.1. `Usuario`
- **Responsabilidad:** Representa la cuenta autenticable en el sistema.
- **Seguridad:** No almacena contraseñas en texto plano; guarda únicamente `contrasena_hash` generado con salt individual mediante `bcrypt` (RN-01, RN-15).
- **Relaciones:** Posee una colección de `Inmuebles`. Al eliminarse el usuario, se eliminan sus inmuebles por cascada.

### 2.2.2. `Inmueble`
- **Responsabilidad:** Unidad física donde se miden los servicios (casa, departamento, comercio).
- **Campos:** `nombre`, `direccion`, `es_demo` (identifica cuentas de ejemplo preconfiguradas).
- **Regla en cascada:** Su eliminación elimina automáticamente todas las lecturas y alertas hijas (HU-07 / RN-16).
- **Métodos:**
  - `alertas_pendientes_conteo(servicio)`: Calcula la cantidad de anomalías no resueltas para los badges de la UI (HU-15).
  - `lecturas_por_servicio(servicio)`: Filtra y ordena cronológicamente las facturas del inmueble.

### 2.2.3. `Lectura`
- **Responsabilidad:** Registra el consumo medido entre dos fechas para un servicio determinado.
- **Unidades Físicas (RN-02):** kWh para Luz, m³ para Gas y Agua (nunca importes en dinero).
- **Métodos de Negocio:**
  - `dias_del_periodo()`: Diferencia en días entre `fecha_fin` y `fecha_inicio` (debe ser ≥ 1).
  - `calcular_consumo_por_dia()`: Prorratea el consumo: consumo / dias (RN-03).
  - `punto_medio()`: Calcula la fecha media del período para determinar la estación climática representativa.
  - `estacion()`: Devuelve `VERANO`, `OTONO`, `INVIERNO` o `PRIMAVERA` según las fechas astronómicas de Argentina (RN-08).

### 2.2.4. `Alerta`
- **Responsabilidad:** Entidad persistida cuando una lectura evaluada resulta anómala (`ALTA` o `BAJA`).
- **Estados de Ciclo de Vida:**
  - `PENDIENTE`: Estado inicial al ser detectada la anomalía.
  - `NORMAL`: El usuario indica que el consumo atípico tuvo motivo justificado (pileta, invitados, estufa). **Efecto clave:** La lectura asociada se excluye de los cálculos futuros para no contaminar la media habitual (RN-11, RN-17).
  - `CONFIRMADA`: El usuario valida que se trató de una fuga, pérdida o problema real (HU-17).

### 2.2.5. `UmbralServicio`
- **Responsabilidad:** Permite al usuario ajustar la sensibilidad del detector por servicio e inmueble (HU-18).
- **Comportamiento:** Si no existe configuración particular, se aplica el valor global por defecto (k = 2.0 desvíos estándar según RN-09). Valores admitidos: 1.0 ≤ k ≤ 3.0.

### 2.2.6. `DetectorAnomalias` — Motor Estadístico del Dominio

Módulo de **funciones puras e independientes de base de datos** (`backend/app/detector.py`) que implementa el algoritmo estadístico de detección:

1. **Condición de aprendizaje:** Si el historial tiene menos de 6 lecturas, devuelve `estado = "aprendiendo"` e indica las lecturas faltantes (RN-07).
2. **Selección de referencia:** Si existen ≥ 2 lecturas de la misma estación, usa la referencia estacional; de lo contrario, usa el historial general (RN-08).
3. **Exclusión de normales:** Ignora lecturas con alertas marcadas como `NORMAL` (RN-11).
4. **Cálculo de límites:**
   - Límite Superior = µ + (k × σ)
   - Límite Inferior = µ − (k × σ)
5. **Piso de desvío (RN-12):** Si σ < 0.10 × µ, se fuerza σ = 0.10 × µ para evitar alarmas falsas ante consumos planos.
6. **Clasificación:** Devuelve `ResultadoEvaluacion` con estado `alta`, `baja` o `dentro`.

---

## 2.3. Reglas de Negocio Clave del Dominio

| ID | Regla | Descripción |
| :--- | :--- | :--- |
| **RN-01** | Hash de contraseña | Las contraseñas se almacenan exclusivamente como hash `bcrypt` con salt individual. |
| **RN-02** | Unidades físicas | Las lecturas expresan siempre la cantidad física consumida: kWh (luz) o m³ (gas, agua). |
| **RN-03** | Prorrateo diario | `consumo_por_dia = consumo_total / (fecha_fin − fecha_inicio)` en días. |
| **RN-07** | Mínimo de lecturas | El detector requiere al menos 6 lecturas del mismo servicio para activarse. |
| **RN-08** | Estacionalidad | Si hay ≥ 2 lecturas de la misma estación astronómica, la comparación es estacional (Argentina). |
| **RN-09** | Umbral por defecto | k = 2.0 desvíos estándar. Alerta si consumo > µ + 2σ (ALTA) o < µ − 2σ (BAJA). |
| **RN-11** | Exclusión de normales | Las lecturas marcadas `NORMAL` se excluyen de los cálculos estadísticos futuros. |
| **RN-12** | Piso de desvío | El desvío efectivo nunca puede ser menor al 10% de la media para evitar falsos positivos. |
| **RN-15** | Seguridad de tokens | Los tokens JWT tienen tiempo de expiración y se validan en cada request protegido. |
| **RN-16** | Borrado en cascada | Eliminar un inmueble elimina automáticamente todas sus lecturas y alertas. |
| **RN-17** | Re-evaluación | Editar o eliminar una lectura desencadena la re-evaluación inmediata de su alerta. |
