import { describe, it, expect } from 'vitest'
import { applyEvent, snapshotToState, type DeliveryState } from '../delivery-state'
import type { DeliverySnapshot, PortalMessage } from '@/types/portal'

const baseSnapshot: DeliverySnapshot = {
  id: 'del-1',
  tenant_id: 'ten-1',
  status: 'assigned',
  public_ref: 'REF-001',
  pickup_address_line: 'Rua A, 1',
  dropoff_address_line: 'Rua B, 2',
  customer_name: 'Maria',
  driver_name: 'João',
  proof_file_id: null,
  created_at: '2026-03-15T10:00:00Z',
  updated_at: '2026-03-15T10:00:00Z',
  messages: [],
  latest_location: null,
}

describe('snapshotToState', () => {
  it('maps snapshot fields to state', () => {
    const state = snapshotToState(baseSnapshot)
    expect(state.id).toBe('del-1')
    expect(state.status).toBe('assigned')
    expect(state.messages).toEqual([])
    expect(state.latestLocation).toBeNull()
  })
})

describe('applyEvent', () => {
  const baseState: DeliveryState = snapshotToState(baseSnapshot)

  it('status_update changes status and updatedAt', () => {
    const next = applyEvent(baseState, {
      type: 'status_update',
      status: 'en_route_pickup',
      updated_at: '2026-03-15T11:00:00Z',
    })
    expect(next.status).toBe('en_route_pickup')
    expect(next.updatedAt).toBe('2026-03-15T11:00:00Z')
    expect(next.id).toBe('del-1') // unchanged
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
    const msg: PortalMessage = { id: 'msg-1', delivery_id: 'del-1', body: 'oi', sender_audience: 'customer', created_at: '2026-03-15T11:10:00Z' }
    const next = applyEvent(baseState, { type: 'new_message', message: msg })
    expect(next.messages).toHaveLength(1)
    expect(next.messages[0].id).toBe('msg-1')
  })

  it('new_message does not mutate previous messages array', () => {
    const msg: PortalMessage = { id: 'msg-1', delivery_id: 'del-1', body: 'oi', sender_audience: 'customer', created_at: '2026-03-15T11:10:00Z' }
    const next = applyEvent(baseState, { type: 'new_message', message: msg })
    expect(baseState.messages).toHaveLength(0) // original unchanged
    expect(next.messages).toHaveLength(1)
  })

  it('proof_attached sets proofFileId', () => {
    const next = applyEvent(baseState, { type: 'proof_attached', proof_file_id: 'file-42' })
    expect(next.proofFileId).toBe('file-42')
  })
})
