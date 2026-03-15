import { describe, it, expect } from 'vitest'
import { stepStateFor, NEXT_STATUS } from '../pipeline-steps'

describe('stepStateFor', () => {
  it('returns active for current status step', () => {
    expect(stepStateFor('en_route_pickup', 'en_route_pickup')).toBe('active')
  })

  it('returns completed for steps before current', () => {
    expect(stepStateFor('picked_up', 'assigned')).toBe('completed')
    expect(stepStateFor('picked_up', 'en_route_pickup')).toBe('completed')
  })

  it('returns pending for steps after current', () => {
    expect(stepStateFor('assigned', 'en_route_pickup')).toBe('pending')
    expect(stepStateFor('assigned', 'delivered')).toBe('pending')
  })

  it('hides failed_attempt step when status is delivered', () => {
    expect(stepStateFor('delivered', 'failed_attempt')).toBe('hidden')
  })

  it('hides delivered step when status is failed_attempt', () => {
    expect(stepStateFor('failed_attempt', 'delivered')).toBe('hidden')
  })

  it('shows failed_attempt as active when status is failed_attempt', () => {
    expect(stepStateFor('failed_attempt', 'failed_attempt')).toBe('active')
  })

  it('shows steps before en_route_dropoff as completed when failed_attempt', () => {
    expect(stepStateFor('failed_attempt', 'assigned')).toBe('completed')
    expect(stepStateFor('failed_attempt', 'en_route_dropoff')).toBe('completed')
  })
})

describe('NEXT_STATUS', () => {
  it('maps status to next in machine', () => {
    expect(NEXT_STATUS['assigned']).toBe('en_route_pickup')
    expect(NEXT_STATUS['en_route_pickup']).toBe('picked_up')
    expect(NEXT_STATUS['picked_up']).toBe('en_route_dropoff')
    expect(NEXT_STATUS['en_route_dropoff']).toBe('delivered')
  })

  it('has no next status for terminal states', () => {
    expect(NEXT_STATUS['delivered']).toBeUndefined()
    expect(NEXT_STATUS['failed_attempt']).toBeUndefined()
  })
})
