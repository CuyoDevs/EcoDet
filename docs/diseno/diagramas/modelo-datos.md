# Modelo de Datos Relacional (ER) · EcoDet
**Sprint 1 · Actividad A6** · Motor: SQLite / SQLAlchemy

---

## Diagrama Entidad-Relación (Mermaid erDiagram)

```mermaid
erDiagram
    USUARIOS ||--o{ INMUEBLES : posee
    INMUEBLES ||--o{ LECTURAS : registra
    INMUEBLES ||--o{ UMBRALES : personaliza
    LECTURAS ||--o| ALERTAS : produce

    USUARIOS {
        int id PK
        string nombre
        string correo UK "Único"
        string contrasena_hash
        datetime fecha_creacion
    }

    INMUEBLES {
        int id PK
        int usuario_id FK "Cascade delete"
        string nombre "Único por usuario"
        string direccion
        boolean es_demo
    }

    LECTURAS {
        int id PK
        int inmueble_id FK "Cascade delete"
        string servicio "LUZ, GAS, AGUA"
        date fecha_inicio
        date fecha_fin ">= fecha_inicio y <= hoy"
        float consumo ">= 0"
        datetime fecha_creacion
    }

    UMBRALES {
        int id PK
        int inmueble_id FK "Cascade delete"
        string servicio "LUZ, GAS, AGUA"
        float valor_desvios "> 0"
    }

    ALERTAS {
        int id PK
        int lectura_id FK "Cascade delete, Unique"
        string tipo "ALTA, BAJA"
        string estado "PENDIENTE, CONFIRMADA, NORMAL"
        float desvio_porcentual
        float consumo_por_dia
        float consumo_habitual_por_dia
        datetime fecha_creacion
    }
```

---

## Restricciones de Integridad y Reglas del Modelo (Sección 3.3 de la Guía)
1. **Unicidad de Usuario:** `correo` es único a nivel global en la tabla `USUARIOS`.
2. **Unicidad de Inmueble:** `(usuario_id, nombre)` es único (no se permite que el mismo usuario tenga dos inmuebles con el mismo nombre).
3. **No superposición de lecturas:** En `LECTURAS`, no se permiten períodos superpuestos para el mismo `(inmueble_id, servicio)`.
4. **Validación de consumo y fechas:** `consumo >= 0`, `fecha_fin >= fecha_inicio` y `fecha_fin <= CURRENT_DATE`.
5. **Borrado en cascada:** Al eliminar un inmueble, se eliminan automáticamente sus lecturas, umbrales y alertas asociadas (`ON DELETE CASCADE`).
