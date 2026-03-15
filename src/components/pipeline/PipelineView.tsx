'use client'

import { AnimatePresence } from 'framer-motion'
import { PIPELINE_STEPS, stepStateFor } from '@/lib/pipeline-steps'
import PipelineStep from './PipelineStep'
import type { DeliveryStatus } from '@/types/portal'

export default function PipelineView({ status }: { status: DeliveryStatus }) {
  return (
    <div className="bg-white rounded-xl border divide-y divide-gray-50">
      <AnimatePresence initial={false}>
        {PIPELINE_STEPS.map((step) => {
          const state = stepStateFor(status, step.status)
          if (state === 'hidden') return null
          return <PipelineStep key={step.status} step={step} state={state} />
        })}
      </AnimatePresence>
    </div>
  )
}

