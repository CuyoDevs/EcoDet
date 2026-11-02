"""Script de generación de datos de prueba (Seed) para EcoDet.

Crea un usuario demo con inmuebles, lecturas históricas de servicios (Luz, Gas, Agua),
estadísticas, variación estacional y una alerta atípica para visualizar todos los
componentes de gráficos, detector y estados vacíos de la aplicación.

Uso:
    python backend/seed.py
    o
    python -m backend.seed (desde la raíz del proyecto)
"""
import os
import sys
from datetime import date

# Asegurar encoding UTF-8 en Windows para la salida por consola
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Asegurar que el directorio raíz y backend estén en el sys.path
directorio_actual = os.path.dirname(os.path.abspath(__file__))
directorio_raiz = os.path.dirname(directorio_actual)
if directorio_actual not in sys.path:
    sys.path.insert(0, directorio_actual)
if directorio_raiz not in sys.path:
    sys.path.insert(0, directorio_raiz)

from app.database import engine, Base, SessionLocal
from app.models import (
    Usuario, Inmueble, Lectura, Alerta,
    ServicioEnum, TipoAlertaEnum, EstadoAlertaEnum
)
from app.security import hashear_contrasena


def poblar_base_de_datos():
    print("=" * 60)
    print("🌱 Sembrando datos de prueba en EcoDet...")
    print("=" * 60)

    # 1. Asegurar tablas creadas
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        # 2. Crear o actualizar usuario Demo
        correo_demo = "demo@ecodet.com"
        password_demo = "Password123"

        usuario = db.query(Usuario).filter(Usuario.correo == correo_demo).first()
        if usuario:
            print(f"ℹ️  El usuario '{correo_demo}' ya existe. Limpiando inmuebles previos...")
            # Al eliminar inmuebles, por cascade se eliminan lecturas y alertas
            db.query(Inmueble).filter(Inmueble.usuario_id == usuario.id).delete()
            db.commit()
        else:
            print(f"👤 Creando usuario demo: {correo_demo}")
            usuario = Usuario(
                nombre="Usuario Demo",
                correo=correo_demo,
                contrasena_hash=hashear_contrasena(password_demo)
            )
            db.add(usuario)
            db.commit()
            db.refresh(usuario)

        # -------------------------------------------------------------
        # Inmueble 1: "Casa Principal" (Completo: Luz >= 6 con alerta, Gas >= 6, Agua < 6)
        # -------------------------------------------------------------
        print("\n🏠 Creando Inmueble 1: 'Casa Principal' (Gráficos completos, detectores y alertas)...")
        casa = Inmueble(
            usuario_id=usuario.id,
            nombre="Casa Principal",
            direccion="Av. San Martín 450, Ciudad",
            es_demo=True
        )
        db.add(casa)
        db.commit()
        db.refresh(casa)

        # Lecturas de LUZ (8 meses -> detector ACTIVO, con una lectura anómala alta)
        lecturas_luz_datos = [
            (date(2025, 5, 1), date(2025, 5, 31), 180.0, False),
            (date(2025, 6, 1), date(2025, 6, 30), 195.0, False),
            (date(2025, 7, 1), date(2025, 7, 31), 210.0, False),
            (date(2025, 8, 1), date(2025, 8, 31), 190.0, False),
            (date(2025, 9, 1), date(2025, 9, 30), 185.0, False),
            (date(2025, 10, 1), date(2025, 10, 31), 200.0, False),
            (date(2025, 11, 1), date(2025, 11, 30), 450.0, True),   # 🚨 ANOMALÍA: salto a más del doble
            (date(2025, 12, 1), date(2025, 12, 31), 215.0, False),
        ]

        for f_ini, f_fin, consumo, tiene_anomalia in lecturas_luz_datos:
            lectura = Lectura(
                inmueble_id=casa.id,
                servicio=ServicioEnum.LUZ,
                fecha_inicio=f_ini,
                fecha_fin=f_fin,
                consumo=consumo
            )
            db.add(lectura)
            db.commit()
            db.refresh(lectura)

            if tiene_anomalia:
                alerta = Alerta(
                    lectura_id=lectura.id,
                    tipo=TipoAlertaEnum.ALTA,
                    estado=EstadoAlertaEnum.PENDIENTE,
                    desvio_porcentual=125.0,
                    consumo_por_dia=lectura.consumo_por_dia,
                    consumo_habitual_por_dia=6.5
                )
                db.add(alerta)
                db.commit()

        # Lecturas de GAS (7 meses -> detector ACTIVO, curva estacional de invierno)
        lecturas_gas_datos = [
            (date(2025, 5, 1), date(2025, 5, 31), 45.0),
            (date(2025, 6, 1), date(2025, 6, 30), 95.0),
            (date(2025, 7, 1), date(2025, 7, 31), 150.0),  # Pico de invierno
            (date(2025, 8, 1), date(2025, 8, 31), 135.0),
            (date(2025, 9, 1), date(2025, 9, 30), 80.0),
            (date(2025, 10, 1), date(2025, 10, 31), 48.0),
            (date(2025, 11, 1), date(2025, 11, 30), 38.0),
        ]
        for f_ini, f_fin, consumo in lecturas_gas_datos:
            lectura = Lectura(
                inmueble_id=casa.id,
                servicio=ServicioEnum.GAS,
                fecha_inicio=f_ini,
                fecha_fin=f_fin,
                consumo=consumo
            )
            db.add(lectura)
        db.commit()

        # Lecturas de AGUA (3 meses -> detector INACTIVO porque son < 6)
        lecturas_agua_datos = [
            (date(2025, 10, 1), date(2025, 10, 31), 18.0),
            (date(2025, 11, 1), date(2025, 11, 30), 20.5),
            (date(2025, 12, 1), date(2025, 12, 31), 22.0),
        ]
        for f_ini, f_fin, consumo in lecturas_agua_datos:
            lectura = Lectura(
                inmueble_id=casa.id,
                servicio=ServicioEnum.AGUA,
                fecha_inicio=f_ini,
                fecha_fin=f_fin,
                consumo=consumo
            )
            db.add(lectura)
        db.commit()

        # -------------------------------------------------------------
        # Inmueble 2: "Departamento Centro" (Solo Luz y Gas, sin Agua - RN-04)
        # -------------------------------------------------------------
        print("🏢 Creando Inmueble 2: 'Departamento Centro' (Solo Luz y Gas, demuestra RN-04 sin Agua)...")
        depto = Inmueble(
            usuario_id=usuario.id,
            nombre="Departamento Centro",
            direccion="Belgrano 120, Piso 4 B",
            es_demo=True
        )
        db.add(depto)
        db.commit()
        db.refresh(depto)

        for mes in range(1, 6):
            # 5 lecturas de Luz
            db.add(Lectura(
                inmueble_id=depto.id,
                servicio=ServicioEnum.LUZ,
                fecha_inicio=date(2025, mes, 1),
                fecha_fin=date(2025, mes, 28),
                consumo=110.0 + mes * 5
            ))
            # 5 lecturas de Gas
            db.add(Lectura(
                inmueble_id=depto.id,
                servicio=ServicioEnum.GAS,
                fecha_inicio=date(2025, mes, 1),
                fecha_fin=date(2025, mes, 28),
                consumo=30.0 + mes * 2
            ))
        db.commit()

        # -------------------------------------------------------------
        # Inmueble 3: "Cabaña de Verano" (Sin lecturas -> Estado vacío HU-10)
        # -------------------------------------------------------------
        print("🌲 Creando Inmueble 3: 'Cabaña de Verano' (Sin lecturas para probar estado vacío)...")
        cabana = Inmueble(
            usuario_id=usuario.id,
            nombre="Cabaña de Verano",
            direccion="Ruta Panamericana km 24",
            es_demo=True
        )
        db.add(cabana)
        db.commit()

        print("\n" + "=" * 60)
        print("✅ ¡Semilla generada con éxito!")
        print("=" * 60)
        print("🔑 Credenciales de inicio de sesión:")
        print(f"   Correo:     {correo_demo}")
        print(f"   Contraseña: {password_demo}")
        print("\n📊 Inmuebles disponibles:")
        print("   1. Casa Principal:")
        print("      - Luz (8 lecturas): Detector ACTIVO 🟢, incluye 1 alerta destacada 🔴")
        print("      - Gas (7 lecturas): Detector ACTIVO 🟢, muestra curva estacional")
        print("      - Agua (3 lecturas): Detector INACTIVO ⚪ (< 6 lecturas)")
        print("   2. Departamento Centro:")
        print("      - Luz y Gas (5 lecturas c/u)")
        print("      - Sin Agua (demuestra RN-04: agua opcional sin errores)")
        print("   3. Cabaña de Verano:")
        print("      - Sin lecturas (demuestra estado vacío y botón para cargar la 1ra lectura)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error al sembrar los datos: {e}")
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    poblar_base_de_datos()
