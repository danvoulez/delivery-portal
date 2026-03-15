import type { DeliveryStatus } from '@/types/portal'

export type StepState = 'completed' | 'active' | 'pending' | 'hidden'

export interface PipelineStep {
  status: DeliveryStatus
  label: string
  /** When true, the UI renders this step with failure styling (red) instead of the default active styling (blue). */
  failureTerminal?: boolean
}

export const PIPELINE_STEPS: PipelineStep[] = [
  { status: 'assigned',         label: 'Pedido atribuído' },
  { status: 'en_route_pickup',  label: 'A caminho da coleta' },
  { status: 'picked_up',        label: 'Pacote coletado' },
  { status: 'en_route_dropoff', label: 'A caminho da entrega' },
  { status: 'delivered',        label: 'Entregue' },
  { status: 'failed_attempt',   label: 'Entrega não realizada', failureTerminal: true },
]

// The canonical ordering for progress comparison.
// NOTE: The parallel terminals (delivered / failed_attempt) are handled by the
// explicit guard clauses at the top of stepStateFor — index comparison for these
// two statuses is never reached when they are current. Their relative order here
// only matters for determining whether pre-terminal steps are 'completed'.
const STATUS_ORDER: DeliveryStatus[] = [
  'assigned',
  'en_route_pickup',
  'picked_up',
  'en_route_dropoff',
  'delivered',
  'failed_attempt',
]

export function stepStateFor(currentStatus: DeliveryStatus, stepStatus: DeliveryStatus): StepState {
  if (currentStatus === 'failed_attempt') {
    if (stepStatus === 'delivered') return 'hidden'
    if (stepStatus === 'failed_attempt') return 'active'
  }
  if (currentStatus === 'delivered') {
    if (stepStatus === 'failed_attempt') return 'hidden'
  }

  const currentIdx = STATUS_ORDER.indexOf(currentStatus)
  const stepIdx = STATUS_ORDER.indexOf(stepStatus)

  if (currentIdx === -1) throw new Error(`stepStateFor: unknown currentStatus "${currentStatus}"`)
  if (stepIdx === -1) throw new Error(`stepStateFor: unknown stepStatus "${stepStatus}"`)

  if (stepIdx < currentIdx) return 'completed'
  if (stepIdx === currentIdx) return 'active'
  return 'pending'
}

export const NEXT_STATUS: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  assigned:         'en_route_pickup',
  en_route_pickup:  'picked_up',
  picked_up:        'en_route_dropoff',
  en_route_dropoff: 'delivered',
}
