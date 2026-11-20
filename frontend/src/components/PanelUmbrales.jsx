// PanelUmbrales.jsx — HU-18 / DET-26 · CU-07, RN-09, RN-17
// Parte de la vista W5: permite cambiar el umbral de sensibilidad (en desvíos) de cada servicio
// de un inmueble. Un umbral mayor genera menos alertas y uno menor, más. El cambio aplica solo
// a las detecciones siguientes: las alertas ya generadas no se recalculan.
import React, { useEffect, useState } from 'react'
import { CheckCircle2, SlidersHorizontal } from 'lucide-react'
import { guardarUmbral, obtenerUmbrales } from '../api/umbrales'

const ETIQUETAS_SERVICIO = { LUZ: 'Luz', GAS: 'Gas', AGUA: 'Agua' }
const MENSAJE_INVALIDO = 'Ingresá un número mayor que cero.'

// 2 -> "2,0" · 3.25 -> "3,25" (el wireframe W5 usa coma decimal).
function formatear(valor) {
  const numero = Number(valor)
  const texto = Number.isInteger(numero) ? numero.toFixed(1) : String(numero)
  return texto.replace('.', ',')
}

// Acepta "3,5" o "3.5". Devuelve null si no es un número mayor que cero.
function leerNumero(texto) {
  const limpio = texto.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(limpio)) return null
  const numero = Number(limpio)
  return Number.isFinite(numero) && numero > 0 ? numero : null
}

function FilaUmbral({ inmuebleId, servicio, inicial }) {
  const etiqueta = ETIQUETAS_SERVICIO[servicio] ?? servicio
  const [vigente, setVigente] = useState(inicial)
  const [texto, setTexto] = useState(formatear(inicial))
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiarTexto = (valor) => {
    setTexto(valor)
    setError('')
    setAviso('')
  }

  const guardar = async (evento) => {
    evento.preventDefault()
    setAviso('')
    const valor = leerNumero(texto)
    if (valor === null) {
      // Se rechaza sin llamar a la API y el umbral vigente no cambia.
      setError(MENSAJE_INVALIDO)
      return
    }
    setGuardando(true)
    setError('')
    try {
      const guardado = await guardarUmbral(inmuebleId, servicio, valor)
      setVigente(guardado.desvios)
      setTexto(formatear(guardado.desvios))
      setAviso(`Umbral de ${etiqueta} guardado: ${formatear(guardado.desvios)} desvíos. Se aplica a las próximas lecturas.`)
    } catch (err) {
      setError(err.errores?.desvios || err.errores?.general || err.message || 'No se pudo guardar el umbral.')
    } finally {
      setGuardando(false)
    }
  }

  const idCampo = `umbral-${servicio}`
  return (
    <form onSubmit={guardar} data-testid={idCampo} className="space-y-1" noValidate>
      <label htmlFor={idCampo} className="block text-xs font-medium text-slate-600">
        Umbral de {etiqueta} (desvíos)
      </label>
      <div className="flex items-center gap-2">
        <input
          id={idCampo}
          type="text"
          inputMode="decimal"
          value={texto}
          onChange={(e) => cambiarTexto(e.target.value)}
          aria-invalid={Boolean(error)}
          aria-describedby={`${idCampo}-mensaje`}
          className="w-24 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
        />
        <button
          type="submit"
          disabled={guardando}
          aria-label={`Guardar umbral de ${etiqueta}`}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600 disabled:opacity-60"
        >
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
      <p className="text-xs text-slate-500">Vigente: {formatear(vigente)} desvíos</p>
      <div id={`${idCampo}-mensaje`}>
        {error && (
          <p role="alert" className="text-xs text-red-700">
            {error}
          </p>
        )}
        {aviso && (
          <p role="status" className="flex items-start gap-1 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span>{aviso}</span>
          </p>
        )}
      </div>
    </form>
  )
}

export default function PanelUmbrales({ inmuebleId }) {
  const [umbrales, setUmbrales] = useState(null)
  const [errorCarga, setErrorCarga] = useState('')

  useEffect(() => {
    let activo = true
    setUmbrales(null)
    setErrorCarga('')
    obtenerUmbrales(inmuebleId)
      .then((lista) => {
        if (activo) setUmbrales(lista)
      })
      .catch((err) => {
        if (activo) setErrorCarga(err.errores?.general || err.message || 'No se pudieron cargar los umbrales.')
      })
    return () => {
      activo = false
    }
  }, [inmuebleId])

  return (
    <section
      aria-label="Sensibilidad del detector"
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div>
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Sensibilidad del detector
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Un umbral mayor genera menos alertas y uno menor, más. El cambio se aplica a las próximas lecturas; las
          alertas ya generadas no se modifican.
        </p>
      </div>

      {errorCarga && (
        <p role="alert" className="text-sm text-red-700">
          {errorCarga}
        </p>
      )}

      {!umbrales && !errorCarga && <p className="text-sm text-slate-500">Cargando umbrales…</p>}

      {umbrales && (
        <div className="grid gap-4 sm:grid-cols-3">
          {umbrales.map((umbral) => (
            <FilaUmbral
              key={umbral.servicio}
              inmuebleId={inmuebleId}
              servicio={umbral.servicio}
              inicial={umbral.desvios}
            />
          ))}
        </div>
      )}
    </section>
  )
}
