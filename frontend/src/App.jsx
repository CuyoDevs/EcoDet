import React, { useState, useEffect } from 'react'
import { Activity, Database, CheckCircle2, XCircle, AlertCircle, RefreshCw, Zap, Flame, Droplets } from 'lucide-react'

export default function App() {
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      // Intenta conectar a través del proxy de Vite o directo a localhost:8000
      const res = await fetch('/api/health').catch(() => fetch('http://127.0.0.1:8000/api/health'))
      if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setHealth(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealth()
  }, [])

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 py-4 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-teal-600 text-white p-2 rounded-lg shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">EcoDet</h1>
              <p className="text-xs text-slate-500">Detector de anomalías en consumo del hogar</p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-xs text-slate-600 bg-slate-100 py-1.5 px-3 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Sprint 1 · HU-01 (DET-9)</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Estado del Entorno y Conexión</h2>
              <p className="text-slate-600 text-sm mt-1">
                Verificación de entorno base, base de datos relacional (SQLite) y parámetros de configuración.
              </p>
            </div>
            <button
              onClick={fetchHealth}
              disabled={loading}
              className="inline-flex items-center space-x-2 text-sm bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Verificar de nuevo</span>
            </button>
          </div>

          {/* Cards de Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            {/* Backend API */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-teal-600" /> API Backend (FastAPI)
                </span>
                {loading ? (
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Verificando...</span>
                ) : health ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> En línea
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Sin conexión
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {health ? `Ambiente: ${health.environment} | HTTP 200 OK` : error || 'No se pudo contactar al servidor'}
              </p>
            </div>

            {/* Base de Datos SQLite */}
            <div className="border border-slate-200 rounded-xl p-5 bg-slate-50/50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Database className="w-4 h-4 text-teal-600" /> Base de Datos (SQLite)
                </span>
                {loading ? (
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">Verificando...</span>
                ) : health && health.database?.includes('SQLite') ? (
                  <span className="inline-flex items-center gap-1 text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conectada
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs bg-red-100 text-red-800 px-2.5 py-0.5 rounded-full font-medium">
                    <XCircle className="w-3.5 h-3.5" /> Desconectada
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">
                {health ? health.database : 'Esperando respuesta de base de datos...'}
              </p>
            </div>
          </div>

          {/* Parámetros del Sistema (Configuración D-10) */}
          <div className="border border-slate-200 rounded-xl p-6 bg-white">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-teal-600" /> Parámetros del Detector (Cargados desde config.json)
            </h3>
            {health?.detector_parameters ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Mínimo de lecturas</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {health.detector_parameters.minimo_de_lecturas}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Antes de emitir alertas (RN-07)</div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Umbral inicial</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {health.detector_parameters.umbral_inicial_en_desvios} σ
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Desvíos estándar de tolerancia (RN-09)</div>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                  <div className="text-xs text-slate-500 font-medium">Piso del desvío</div>
                  <div className="text-2xl font-bold text-slate-900 mt-1">
                    {health.detector_parameters.piso_del_desvio_porcentaje_del_promedio} %
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Mínimo para consumos estables (RN-12)</div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic">Cargando parámetros del sistema...</p>
            )}
          </div>
        </div>

        {/* Muestra de Servicios Base */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-amber-50 rounded-lg text-amber-500">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Electricidad</div>
              <div className="text-xs text-slate-500">Unidad fija: kWh (Luz)</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-blue-50 rounded-lg text-blue-500">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Gas Natural</div>
              <div className="text-xs text-slate-500">Unidad fija: m³ (Gas)</div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center space-x-4">
            <div className="p-3 bg-cyan-50 rounded-lg text-cyan-500">
              <Droplets className="w-6 h-6" />
            </div>
            <div>
              <div className="text-sm font-semibold text-slate-800">Agua de Red</div>
              <div className="text-xs text-slate-500">Unidad fija: m³ (Opcional)</div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-center text-xs text-slate-500">
        EcoDet · CuyoDevs · Taller de Tecnología Aplicada · 2026
      </footer>
    </div>
  )
}
