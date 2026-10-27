# Diagrama de Casos de Uso · EcoDet
**Sprint 1 · Actividad A5** · Insumo: Secciones 2 y 4 de la Documentación de Apoyo

---

## Actores y Casos de Uso

```mermaid
flowchart LR
    subgraph Actores
        V["👤 Visitante"]
        U["👤 Usuario"]
        S["⚙️ Sistema"]
    end

    subgraph CasosDeUso["Casos de Uso EcoDet"]
        CU01(["CU-01 Registrarse"])
        CU02(["CU-02 Iniciar sesión"])
        CU10(["CU-10 Cerrar sesión"])
        CU03(["CU-03 Gestionar inmuebles"])
        CU04(["CU-04 Cargar lecturas (individual e histórica)"])
        CU05(["CU-05 Consultar historial y gráficos"])
        CU06(["CU-06 Detectar anomalías en el consumo"])
        CU07(["CU-07 Gestionar alertas"])
        CU08(["CU-08 Cargar datos de ejemplo"])
        CU09(["CU-09 Editar o eliminar una lectura"])
    end

    V --> CU01
    V --> CU02
    
    U --> CU10
    U --> CU03
    U --> CU04
    U --> CU05
    U --> CU07
    U --> CU08
    U --> CU09

    CU04 -.->|«include»| CU06
    CU09 -.->|«include»| CU06
    CU08 -.->|«include»| CU06
    S --> CU06
```

### Relaciones clave:
- El **Visitante** pasa a ser **Usuario** al registrarse (CU-01) o iniciar sesión (CU-02).
- La carga de lecturas (CU-04), carga de datos demo (CU-08) y la edición de lecturas (CU-09) disparan automáticamente el motor de detección de anomalías del **Sistema** (CU-06).
