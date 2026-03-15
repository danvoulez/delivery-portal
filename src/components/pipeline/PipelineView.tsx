'use client'
import type { DeliveryStatus } from '@/types/portal'
export default function PipelineView({ status }: { status: DeliveryStatus }) {
  return <div data-testid="pipeline">{status}</div>
}
