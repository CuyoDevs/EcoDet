"""Conjunto de datos del inmueble de demostración (HU-19 / DET-27, CU-08, RN-16).

Son datos fijos y sin dependencias de base de datos, para que el conjunto y la tabla de
resultados esperados se puedan revisar y probar solos.

- Luz y gas: 24 meses (nov 2024 a oct 2026). Cada estación tiene 6 lecturas, así que el
  detector usa referencia estacional (RN-08). Una anomalía por estación como máximo, para que
  no se contaminen entre sí.
- Agua: 12 meses (nov 2025 a oct 2026). Cada estación tiene 3 lecturas, quedan 2 al descontar
  la evaluada, así que el detector usa el historial general (RN-08).
- Por servicio: 2 anomalías altas y 1 baja, con umbral inicial de 2 desvíos y piso del 10 %
  (RN-09, RN-12). Las demás lecturas quedan dentro de los límites.

Las fechas son fijas y pasadas (RN-03). Los consumos están en kWh (luz) y m³ (gas y agua).
"""
import calendar
from datetime import date

NOMBRE_DEMO = "Demo (ejemplo)"
DIRECCION_DEMO = "Inmueble de demostración"

# servicio -> (año de inicio, mes de inicio, consumo de cada mes consecutivo)
SERIES_DEMO = {
    "LUZ": (
        2024,
        11,
        [
            218.2,  # nov 2024
            319.3,  # dic 2024
            310.0,  # ene 2025
            268.8,  # feb 2025
            225.7,  # mar 2025
            106.1,  # abr 2025  <- BAJA
            212.7,  # may 2025
            275.4,  # jun 2025
            460.1,  # jul 2025  <- ALTA
            287.4,  # ago 2025
            225.0,  # sep 2025
            223.2,  # oct 2025
            234.0,  # nov 2025
            313.1,  # dic 2025
            501.3,  # ene 2026  <- ALTA
            285.6,  # feb 2026
            210.5,  # mar 2026
            216.3,  # abr 2026
            217.0,  # may 2026
            259.2,  # jun 2026
            290.2,  # jul 2026
            281.8,  # ago 2026
            220.5,  # sep 2026
            237.2,  # oct 2026
        ],
    ),
    "GAS": (
        2024,
        11,
        [
            43.7,  # nov 2024
            16.0,  # dic 2024
            15.5,  # ene 2025
            13.4,  # feb 2025
            48.4,  # mar 2025
            45.5,  # abr 2025
            45.6,  # may 2025
            122.4,  # jun 2025
            120.3,  # jul 2025
            204.4,  # ago 2025  <- ALTA
            45.0,  # sep 2025
            89.3,  # oct 2025  <- ALTA
            46.8,  # nov 2025
            15.7,  # dic 2025
            15.2,  # ene 2026
            14.3,  # feb 2026
            45.1,  # mar 2026
            20.9,  # abr 2026  <- BAJA
            46.5,  # may 2026
            115.2,  # jun 2026
            129.0,  # jul 2026
            125.2,  # ago 2026
            44.1,  # sep 2026
            47.4,  # oct 2026
        ],
    ),
    "AGUA": (
        2025,
        11,
        [
            16.0,  # nov 2025
            17.6,  # dic 2025
            34.1,  # ene 2026  <- ALTA
            14.8,  # feb 2026
            17.7,  # mar 2026
            3.3,  # abr 2026  <- BAJA
            16.7,  # may 2026
            16.8,  # jun 2026
            34.7,  # jul 2026  <- ALTA
            17.6,  # ago 2026
            16.5,  # sep 2026
            16.4,  # oct 2026
        ],
    ),
}

# Tabla de resultados esperados: lecturas que el detector debe marcar (servicio, inicio, tipo).
ALERTAS_ESPERADAS = [
    ("LUZ", date(2025, 4, 1), "BAJA"),
    ("LUZ", date(2025, 7, 1), "ALTA"),
    ("LUZ", date(2026, 1, 1), "ALTA"),
    ("GAS", date(2025, 8, 1), "ALTA"),
    ("GAS", date(2025, 10, 1), "ALTA"),
    ("GAS", date(2026, 4, 1), "BAJA"),
    ("AGUA", date(2026, 1, 1), "ALTA"),
    ("AGUA", date(2026, 4, 1), "BAJA"),
    ("AGUA", date(2026, 7, 1), "ALTA"),
]


def periodos_demo(servicio: str) -> list[tuple[date, date, float]]:
    """Devuelve (fecha_inicio, fecha_fin, consumo) de cada mes del servicio, mes completo."""
    anio, mes, consumos = SERIES_DEMO[servicio]
    periodos = []
    for consumo in consumos:
        ultimo_dia = calendar.monthrange(anio, mes)[1]
        periodos.append((date(anio, mes, 1), date(anio, mes, ultimo_dia), consumo))
        mes += 1
        if mes == 13:
            anio, mes = anio + 1, 1
    return periodos
