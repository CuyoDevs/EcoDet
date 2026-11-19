import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import MarcarAlertaNormalModal, { ADVERTENCIA_MARCAR_NORMAL } from './MarcarAlertaNormalModal'

const ALERTA = { id: 10, fecha_inicio: '2025-07-01', fecha_fin: '2025-07-28' }

function montar(props = {}) {
  const onConfirmar = vi.fn()
  const onCancelar = vi.fn()
  render(
    <MarcarAlertaNormalModal
      alerta={ALERTA}
      servicio="Luz"
      onConfirmar={onConfirmar}
      onCancelar={onCancelar}
      {...props}
    />
  )
  return { onConfirmar, onCancelar, user: userEvent.setup() }
}

describe('MarcarAlertaNormalModal (HU-16 / DET-102)', () => {
  it('dice qué alerta se marca y advierte que solo aplica hacia adelante', () => {
    montar()

    const dialogo = screen.getByRole('alertdialog')
    expect(dialogo).toHaveTextContent('alerta de Luz')
    expect(dialogo).toHaveTextContent('2025-07-01 al 2025-07-28')
    expect(dialogo).toHaveTextContent(ADVERTENCIA_MARCAR_NORMAL)
  })

  it('"Sí, marcar como normal" confirma y "Cancelar" cancela', async () => {
    const { onConfirmar, onCancelar, user } = montar()

    await user.click(screen.getByRole('button', { name: 'Sí, marcar como normal' }))
    expect(onConfirmar).toHaveBeenCalledTimes(1)
    expect(onCancelar).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('Escape cancela', async () => {
    const { onCancelar, user } = montar()

    await user.keyboard('{Escape}')

    expect(onCancelar).toHaveBeenCalledTimes(1)
  })

  it('mientras guarda deshabilita los botones y Escape no cancela', async () => {
    const { onCancelar, user } = montar({ enviando: true })

    expect(screen.getByRole('button', { name: 'Guardando…' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeDisabled()
    await user.keyboard('{Escape}')
    expect(onCancelar).not.toHaveBeenCalled()
  })

  it('muestra el error de la API', () => {
    montar({ error: 'Alerta no encontrada.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Alerta no encontrada.')
  })
})
