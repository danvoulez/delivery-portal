import { describe, it, expect } from 'vitest'
import { applyEvent, type DeliveryState } from '../delivery-state'
import type { DeliveryMessageView } from '@/types/portal'
import { trackingViewToState, jobViewToState, mapLocation } from '../portal-mapper'
import type { PublicDeliveryTrackingView, DriverDeliveryJobView, LatestLocationView } from '@/types/portal'

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
    expect(state.updatedAt).toBeNull()
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

  it('maps all messages when messageThreadPreview has multiple entries', () => {
    const msg1: DeliveryMessageView = {
      id: 'msg-a',
      senderLabel: 'Customer',
      body: 'Where is my order?',
      createdAt: '2026-03-15T13:00:00Z',
      audience: 'customer',
    }
    const msg2: DeliveryMessageView = {
      id: 'msg-b',
      senderLabel: 'Driver',
      body: 'Almost there',
      createdAt: '2026-03-15T13:05:00Z',
      audience: 'driver',
    }
    const msg3: DeliveryMessageView = {
      id: 'msg-c',
      senderLabel: 'Ops',
      body: 'Noted',
      createdAt: '2026-03-15T13:06:00Z',
      audience: 'ops',
    }
    const view: PublicDeliveryTrackingView = {
      deliveryPublicRef: 'REF-007',
      status: 'en_route_dropoff',
      statusLabel: 'A caminho da entrega',
      timeline: [],
      etaSimple: null,
      destinationSummary: 'Rua E, 5',
      latestLocation: null,
      lastLocationAt: null,
      proofSummary: null,
      messageThreadPreview: [msg1, msg2, msg3],
    }

    const state = trackingViewToState(view)

    expect(state.messages).toHaveLength(3)
    expect(state.messages[0].id).toBe('msg-a')
    expect(state.messages[1].id).toBe('msg-b')
    expect(state.messages[2].id).toBe('msg-c')
    expect(state.messages[2].audience).toBe('ops')
  })

  it('maps accuracyMeters: null from location view to accuracy_meters: null in state', () => {
    const view: PublicDeliveryTrackingView = {
      deliveryPublicRef: 'REF-008',
      status: 'picked_up',
      statusLabel: 'Pacote coletado',
      timeline: [],
      etaSimple: null,
      destinationSummary: 'Rua F, 6',
      latestLocation: {
        latitude: -23.1,
        longitude: -46.1,
        accuracyMeters: null,
        recordedAt: '2026-03-15T14:00:00Z',
      },
      lastLocationAt: '2026-03-15T14:00:00Z',
      proofSummary: null,
      messageThreadPreview: [],
    }

    const state = trackingViewToState(view)

    expect(state.latestLocation).not.toBeNull()
    expect(state.latestLocation?.accuracy_meters).toBeNull()
    expect(state.latestLocation?.lat).toBe(-23.1)
    expect(state.latestLocation?.lng).toBe(-46.1)
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
    expect(state.updatedAt).toBeNull()
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

describe('mapLocation', () => {
  it('renames camelCase fields to snake_case and preserves values', () => {
    const loc: LatestLocationView = {
      latitude: -23.5,
      longitude: -46.6,
      accuracyMeters: 8,
      recordedAt: '2026-03-15T15:00:00Z',
    }
    expect(mapLocation(loc)).toEqual({
      lat: -23.5,
      lng: -46.6,
      accuracy_meters: 8,
      recorded_at: '2026-03-15T15:00:00Z',
    })
  })

  it('passes through accuracyMeters: null as accuracy_meters: null', () => {
    const loc: LatestLocationView = {
      latitude: 0,
      longitude: 0,
      accuracyMeters: null,
      recordedAt: '2026-03-15T15:01:00Z',
    }
    const result = mapLocation(loc)
    expect(result?.accuracy_meters).toBeNull()
  })
})
