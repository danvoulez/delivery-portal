import { describe, it, expect } from 'vitest'
import { applyEvent, type DeliveryState } from '../delivery-state'
import type { DeliveryMessageView } from '@/types/portal'
import { trackingViewToState, jobViewToState } from '../portal-mapper'
import type { PublicDeliveryTrackingView, DriverDeliveryJobView } from '@/types/portal'

const baseState: DeliveryState = {
  status: 'assigned',
  proofFileId: null,
  updatedAt: '2026-03-15T10:00:00Z',
  messages: [],
  latestLocation: null,
}

describe('applyEvent', () => {
  it('status_update changes status and updatedAt', () => {
    const next = applyEvent(baseState, {
      type: 'status_update',
      status: 'en_route_pickup',
      updated_at: '2026-03-15T11:00:00Z',
    })
    expect(next.status).toBe('en_route_pickup')
    expect(next.updatedAt).toBe('2026-03-15T11:00:00Z')
    expect(next.messages).toEqual([]) // unchanged
  })

  it('location_update sets latestLocation', () => {
    const next = applyEvent(baseState, {
      type: 'location_update',
      latitude: -23.5,
      longitude: -46.6,
      accuracy_meters: 10,
      recorded_at: '2026-03-15T11:05:00Z',
    })
    expect(next.latestLocation).toEqual({
      lat: -23.5,
      lng: -46.6,
      accuracy_meters: 10,
      recorded_at: '2026-03-15T11:05:00Z',
    })
    expect(next.status).toBe('assigned') // unchanged
  })

  it('new_message appends message to list', () => {
    const msg: DeliveryMessageView = {
      id: 'msg-1',
      senderLabel: 'Customer',
      body: 'oi',
      createdAt: '2026-03-15T11:10:00Z',
      audience: 'customer',
    }
    const next = applyEvent(baseState, { type: 'new_message', message: msg })
    expect(next.messages).toHaveLength(1)
    expect(next.messages[0].id).toBe('msg-1')
  })

  it('new_message does not mutate previous messages array', () => {
    const msg: DeliveryMessageView = {
      id: 'msg-1',
      senderLabel: 'Customer',
      body: 'oi',
      createdAt: '2026-03-15T11:10:00Z',
      audience: 'customer',
    }
    const next = applyEvent(baseState, { type: 'new_message', message: msg })
    expect(baseState.messages).toHaveLength(0) // original unchanged
    expect(next.messages).toHaveLength(1)
  })

  it('proof_attached sets proofFileId', () => {
    const next = applyEvent(baseState, { type: 'proof_attached', proof_file_id: 'file-42' })
    expect(next.proofFileId).toBe('file-42')
  })

  it('location_update handles null accuracy_meters', () => {
    const next = applyEvent(baseState, {
      type: 'location_update',
      latitude: -23.5,
      longitude: -46.6,
      accuracy_meters: null,
      recorded_at: '2026-03-15T11:05:00Z',
    })
    expect(next.latestLocation?.accuracy_meters).toBeNull()
  })
})

// ─── portal-mapper tests ──────────────────────────────────────────────────────

const sampleMessage: DeliveryMessageView = {
  id: 'msg-10',
  senderLabel: 'Driver',
  body: 'On my way',
  createdAt: '2026-03-15T12:00:00Z',
  audience: 'driver',
}

describe('trackingViewToState', () => {
  it('maps status, location, and messages from a full tracking view', () => {
    const view: PublicDeliveryTrackingView = {
      deliveryPublicRef: 'REF-002',
      status: 'en_route_dropoff',
      statusLabel: 'A caminho da entrega',
      timeline: [],
      etaSimple: '15 min',
      destinationSummary: 'Rua B, 2',
      latestLocation: {
        latitude: -23.5,
        longitude: -46.6,
        accuracyMeters: 5,
        recordedAt: '2026-03-15T12:01:00Z',
      },
      lastLocationAt: '2026-03-15T12:01:00Z',
      proofSummary: null,
      messageThreadPreview: [sampleMessage],
    }

    const state = trackingViewToState(view)

    expect(state.status).toBe('en_route_dropoff')
    expect(state.latestLocation).toEqual({
      lat: -23.5,
      lng: -46.6,
      accuracy_meters: 5,
      recorded_at: '2026-03-15T12:01:00Z',
    })
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].id).toBe('msg-10')
    expect(state.proofFileId).toBeNull()
    expect(state.updatedAt).toBe('2026-03-15T12:01:00Z')
  })

  it('handles null latestLocation in tracking view', () => {
    const view: PublicDeliveryTrackingView = {
      deliveryPublicRef: 'REF-003',
      status: 'assigned',
      statusLabel: 'Pedido atribuído',
      timeline: [],
      etaSimple: null,
      destinationSummary: 'Rua C, 3',
      latestLocation: null,
      lastLocationAt: null,
      proofSummary: null,
      messageThreadPreview: [],
    }

    const state = trackingViewToState(view)

    expect(state.latestLocation).toBeNull()
    expect(state.updatedAt).toBe(new Date(0).toISOString())
  })

  it('sets proofFileId to null (tracking view does not carry proof file ID)', () => {
    const view: PublicDeliveryTrackingView = {
      deliveryPublicRef: 'REF-004',
      status: 'delivered',
      statusLabel: 'Entregue',
      timeline: [],
      etaSimple: null,
      destinationSummary: 'Rua D, 4',
      latestLocation: null,
      lastLocationAt: null,
      proofSummary: { available: true, label: 'Photo' },
      messageThreadPreview: [],
    }

    const state = trackingViewToState(view)
    expect(state.proofFileId).toBeNull()
  })
})

describe('jobViewToState', () => {
  it('maps currentStatus and messages from a driver job view', () => {
    const view: DriverDeliveryJobView = {
      deliveryPublicRef: 'REF-005',
      pickupSummary: 'Rua A, 1',
      dropoffSummary: 'Rua B, 2',
      instructions: 'Leave at door',
      currentStatus: 'picked_up',
      allowedNextStatuses: ['en_route_dropoff'],
      proofRequirements: { requiredForStatuses: ['delivered'] },
      messageThreadPreview: [sampleMessage],
      navigationDeepLink: 'maps://...',
    }

    const state = jobViewToState(view)

    expect(state.status).toBe('picked_up')
    expect(state.latestLocation).toBeNull()
    expect(state.messages).toHaveLength(1)
    expect(state.messages[0].id).toBe('msg-10')
    expect(state.proofFileId).toBeNull()
    expect(state.updatedAt).toBe(new Date(0).toISOString())
  })

  it('handles empty messageThreadPreview', () => {
    const view: DriverDeliveryJobView = {
      deliveryPublicRef: 'REF-006',
      pickupSummary: 'Rua X',
      dropoffSummary: 'Rua Y',
      instructions: null,
      currentStatus: 'assigned',
      allowedNextStatuses: ['en_route_pickup'],
      proofRequirements: { requiredForStatuses: [] },
      messageThreadPreview: [],
      navigationDeepLink: null,
    }

    const state = jobViewToState(view)
    expect(state.messages).toEqual([])
  })
})
