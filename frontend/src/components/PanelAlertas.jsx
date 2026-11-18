// PanelAlertas.jsx — HU-15 / DET-23, DET-97
// Vista W5: lista las alertas de un inmueble con filtros por servicio y estado,
// estado vacío ("consumo dentro de lo normal") y detalle con gráfico del período.
import React, { useEffect, useState } from 'react'
import { AlertTriangle, ArrowLeft, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'
import {
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Title,
  Tooltip,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { listarAlertasInmueble, obtenerDetalleAlerta } from '../api/alertas'
import { listarInmuebles } from '../api/inmuebles'
import { irA } from '../routes/hashRouter'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

const UNIDADES = { LUZ: 'kWh', GAS: 'm³', AGUA: 'm³' }
const ETIQUETAS_SERVICIO = { LUZ: 'Luz', GAS: 'Gas', AGUA: 'Agua' }

const ESTILOS_ESTADO = {
  PENDIENTE: 'bg-amber-100 text-amber-800 border-amber-200',
  CONFIRMADA: 'bg-red-100 text-red-800 border-red-200',
  NORMAL: 'bg-emerald-100 text-emerald-800 border-emerald-200',
}

function formatearDesvio(desvio) {
  const valor = Number(desvio ?? 0)
  const signo = valor > 0 ? '+' : ''
  return `${signo}${valor.toFixed(1)}%`
}

function GraficoPeriodoAlerta({ alerta }) {
  const unidad = UNIDADES[alerta.servicio] ?? ''
  const esAlta = alerta.tipo === 'ALTA'

  const data = {
    labels: ['Consumo habitual/día', 'Consumo del período/día'],
    datasets: [
      {
        label: `Consumo diario (${unidad}/día)`,
        data: [
          Number(alerta.consumo_habitual_por_dia.toFixed(2)),
          Number(alerta.consumo_por_dia.toFixed(2)),
        ],
        backgroundColor: ['#94a3b8', esAlta ? '#ef4444' : '#3b82f6'],
        borderRadius: 6,
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: `Comparación diaria (${alerta.fecha_inicio} al ${alerta.fecha_fin})`,
        color: '#334155',
        font: { size: 13, weight: '600' },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: '#64748b' },
        grid: { color: '#f1f5f9' },
      },
      x: {
        ticks: { color: '#334155' },
        grid: { display: false },
      },
    },
  }

  return (
<<<<<<< HEAD
    <div className="h-56 w-full rounded-lg border border-slate-100 bg-slate-50/60 p-3">
      <Bar data={data} options={options} aria-label="Gráfico comparativo de consumo del período" />
    </div>
  )
}

export default function PanelAlertas({ inmuebleId }) {
  const [nombreInmueble, setNombreInmueble] = useState('')
  const [alertas, setAlertas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [errorLista, setErrorLista] = useState('')

  const [filtroServicio, setFiltroServicio] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('')

  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [errorDetalle, setErrorDetalle] = useState('')

  useEffect(() => {
    let activo = true
    listarInmuebles()
      .then((lista) => {
        if (!activo) return
        const encontrado = lista.find((i) => i.id === Number(inmuebleId))
        if (encontrado) setNombreInmueble(encontrado.nombre)
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [inmuebleId])

  useEffect(() => {
    let activo = true
    setCargando(true)
    setErrorLista('')
    listarAlertasInmueble(inmuebleId, {
      estado: filtroEstado,
      servicio: filtroServicio,
    })
      .then((lista) => {
        if (!activo) return
        setAlertas(lista)
        setAlertaSeleccionada((prev) => {
          if (!prev) return null
          return lista.find((a) => a.id === prev.id) ?? null
        })
      })
      .catch((err) => {
        if (!activo) return
        setErrorLista(err.errores?.general || err.message || 'No se pudieron cargar las alertas.')
        setAlertas([])
      })
      .finally(() => {
        if (activo) setCargando(false)
      })
    return () => {
      activo = false
    }
  }, [inmuebleId, filtroServicio, filtroEstado])

  const seleccionarAlerta = async (alerta) => {
    setErrorDetalle('')
    setCargandoDetalle(true)
    try {
      const detalle = await obtenerDetalleAlerta(alerta.id)
      setAlertaSeleccionada(detalle)
    } catch (err) {
      setErrorDetalle(err.errores?.general || err.message || 'No se pudo cargar el detalle de la alerta.')
    } finally {
      setCargandoDetalle(false)
    }
  }

  const hayFiltrosActivos = Boolean(filtroServicio || filtroEstado)

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => irA('/inmuebles')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-teal-600"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Volver a mis inmuebles
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                Alertas de consumo{nombreInmueble ? ` · ${nombreInmueble}` : ''}
              </h1>
              <p className="text-xs text-slate-500">Inmueble #{inmuebleId}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-6">
        {/* Filtros por servicio y estado (DET-97) */}
        <section
          aria-label="Filtros de alertas"
          className="flex flex-wrap items-end justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap gap-4">
            <div>
              <label htmlFor="filtro-servicio" className="block text-xs font-medium text-slate-600 mb-1">
                Servicio
              </label>
              <select
                id="filtro-servicio"
                value={filtroServicio}
                onChange={(e) => setFiltroServicio(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Todos los servicios</option>
                <option value="LUZ">Luz</option>
                <option value="GAS">Gas</option>
                <option value="AGUA">Agua</option>
              </select>
            </div>

            <div>
              <label htmlFor="filtro-estado" className="block text-xs font-medium text-slate-600 mb-1">
                Estado
              </label>
              <select
                id="filtro-estado"
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              >
                <option value="">Todos los estados</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="CONFIRMADA">Confirmada</option>
                <option value="NORMAL">Normal</option>
              </select>
            </div>
          </div>

          {hayFiltrosActivos && (
            <button
              type="button"
              onClick={() => {
                setFiltroServicio('')
                setFiltroEstado('')
              }}
              className="text-xs font-medium text-teal-700 underline hover:text-teal-900"
            >
              Limpiar filtros
            </button>
          )}
        </section>

        {errorLista && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorLista}
          </div>
        )}

        {cargando ? (
          <p role="status" className="text-sm text-slate-500">
            Cargando alertas…
          </p>
        ) : alertas.length === 0 && !errorLista ? (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-8 text-center space-y-2">
            <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" aria-hidden="true" />
            <h2 className="text-base font-semibold text-emerald-900">
              {hayFiltrosActivos
                ? 'No hay alertas que coincidan con los filtros seleccionados'
                : 'El consumo está dentro de lo normal'}
            </h2>
            <p className="text-sm text-emerald-800">
              {hayFiltrosActivos
                ? 'Probá cambiar o limpiar los filtros para revisar el resto de las alertas del inmueble.'
                : 'Este inmueble no registra desvíos anómalos en sus lecturas de consumo.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Listado de alertas */}
            <section aria-label="Listado de alertas" className="lg:col-span-6 space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Alertas detectadas ({alertas.length})
              </h2>
              <ul className="space-y-3">
                {alertas.map((alerta) => {
                  const seleccionada = alertaSeleccionada?.id === alerta.id
                  const esAlta = alerta.tipo === 'ALTA'
                  const unidad = UNIDADES[alerta.servicio] ?? ''
                  return (
                    <li key={alerta.id}>
                      <button
                        type="button"
                        onClick={() => seleccionarAlerta(alerta)}
                        aria-pressed={seleccionada}
                        className={`w-full text-left rounded-lg border p-4 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-teal-600 ${
                          seleccionada
                            ? 'border-teal-600 bg-teal-50/40'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                              {ETIQUETAS_SERVICIO[alerta.servicio] ?? alerta.servicio}
                            </span>
                            <p className="text-sm font-semibold text-slate-900 mt-0.5">
                              {alerta.fecha_inicio} — {alerta.fecha_fin}
                            </p>
                          </div>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                              ESTILOS_ESTADO[alerta.estado] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {alerta.estado}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span
                            className={`inline-flex items-center gap-1 font-medium ${
                              esAlta ? 'text-red-600' : 'text-blue-600'
                            }`}
                          >
                            {esAlta ? (
                              <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                            ) : (
                              <TrendingDown className="h-3.5 w-3.5" aria-hidden="true" />
                            )}
                            {esAlta ? 'Consumo alto' : 'Consumo bajo'} ({formatearDesvio(alerta.desvio_porcentual)})
                          </span>
                          <span className="text-slate-500">
                            {alerta.consumo_por_dia.toFixed(2)} {unidad}/día
                          </span>
                        </div>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </section>

            {/* Detalle y gráfico del período */}
            <section aria-label="Detalle de la alerta" className="lg:col-span-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500 mb-3">
                Detalle del período
              </h2>

              {errorDetalle && (
                <div role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  {errorDetalle}
                </div>
              )}

              {cargandoDetalle ? (
                <div className="rounded-lg border border-slate-200 bg-white p-6">
                  <p role="status" className="text-sm text-slate-500">
                    Cargando detalle de la alerta…
                  </p>
                </div>
              ) : alertaSeleccionada ? (
                <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
                  <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <AlertTriangle
                          className={`h-5 w-5 ${
                            alertaSeleccionada.tipo === 'ALTA' ? 'text-red-600' : 'text-blue-600'
                          }`}
                          aria-hidden="true"
                        />
                        <h3 className="text-base font-bold text-slate-900">
                          {ETIQUETAS_SERVICIO[alertaSeleccionada.servicio] ?? alertaSeleccionada.servicio} ·{' '}
                          {alertaSeleccionada.tipo === 'ALTA' ? 'Consumo alto' : 'Consumo bajo'}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Período: {alertaSeleccionada.fecha_inicio} al {alertaSeleccionada.fecha_fin}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                        ESTILOS_ESTADO[alertaSeleccionada.estado] ?? 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {alertaSeleccionada.estado}
                    </span>
                  </div>

                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Desvío detectado</dt>
                      <dd
                        className={`mt-0.5 font-bold ${
                          alertaSeleccionada.tipo === 'ALTA' ? 'text-red-600' : 'text-blue-600'
                        }`}
                      >
                        {formatearDesvio(alertaSeleccionada.desvio_porcentual)}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Consumo total del período</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {alertaSeleccionada.consumo} {UNIDADES[alertaSeleccionada.servicio] ?? ''}
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Consumo diario registrado</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {alertaSeleccionada.consumo_por_dia.toFixed(2)} {UNIDADES[alertaSeleccionada.servicio] ?? ''}/día
                      </dd>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <dt className="text-xs text-slate-500">Consumo habitual esperado</dt>
                      <dd className="mt-0.5 font-semibold text-slate-900">
                        {alertaSeleccionada.consumo_habitual_por_dia.toFixed(2)}{' '}
                        {UNIDADES[alertaSeleccionada.servicio] ?? ''}/día
                      </dd>
                    </div>
                  </dl>

                  <GraficoPeriodoAlerta alerta={alertaSeleccionada} />
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
                  <p className="text-sm text-slate-500">
                    Seleccioná una alerta de la lista para ver el detalle y el gráfico del período.
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </main>
    </div>
  )
=======
    <div className="container mt-4">
      <h2>EcoDet - Mis Alertas</h2>
      
      {/* Si hay un error, lo mostramos limpio y evitamos renderizar el grid confuso */}
      {error ? (
        <div className="alert alert-danger mt-3" role="alert">
          {error}
        </div>
      ) : (
        <div className="row mt-3">
          {/* Columna de Listado */}
          <div className="col-md-6">
            <h4>Listado de Alertas</h4>
            {alertas.length === 0 ? (
              <p className="text-muted">No hay alertas registradas.</p>
            ) : (
              <ul className="list-group">
                {alertas.map(alerta => (
                  <li 
                    key={alerta.id} 
                    className="list-group-item list-group-item-action"
                    style={{ cursor: 'pointer' }}
                    onClick={() => verDetalle(alerta.id)}
                  >
                    <strong>{alerta.titulo || `Alerta #${alerta.id}`}</strong> 
                    <span className="float-end badge bg-secondary">{alerta.estado}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Columna de Detalle */}
          <div className="col-md-6">
            <h4>Detalle de la Alerta</h4>
            {alertaSeleccionada ? (
              <div className="card p-3 shadow-sm">
                <h5 className="text-primary">{alertaSeleccionada.titulo}</h5>
                <p><strong>Descripción:</strong> {alertaSeleccionada.descripcion}</p>
                <p><strong>Estado:</strong> <span className="badge bg-info">{alertaSeleccionada.estado}</span></p>
                <p><strong>Fecha de Creación:</strong> {alertaSeleccionada.fecha_creacion || 'N/A'}</p>
              </div>
            ) : (
              <p className="text-muted">Selecciona una alerta de la lista para ver sus detalles completos.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
>>>>>>> a71d287 (Corregir alertas_pendientes en PUT inmuebles, manejo de errores en PanelAlertas y tests de rutas)
}