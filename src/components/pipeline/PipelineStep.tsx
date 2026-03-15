'use client'

import { motion } from 'framer-motion'
import type { PipelineStep as PipelineStepType, StepState } from '@/lib/pipeline-steps'

interface Props {
  step: PipelineStepType
  state: StepState
}

export default function PipelineStep({ step, state }: Props) {
  const isActive = state === 'active'
  const isCompleted = state === 'completed'
  const isFailure = step.failureTerminal === true && isActive

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.2 }}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
        isActive
          ? isFailure
            ? 'bg-red-50 border border-red-200'
            : 'bg-blue-50 border border-blue-200'
          : isCompleted
          ? 'opacity-50'
          : 'opacity-25'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
          isCompleted
            ? 'bg-green-500 text-white'
            : isFailure
            ? 'bg-red-500 text-white'
            : isActive
            ? 'bg-blue-500 text-white'
            : 'bg-gray-200 text-gray-400'
        }`}
      >
        {isCompleted && '✓'}
        {isFailure && '✗'}
        {isActive && !isFailure && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            className="w-2 h-2 bg-white rounded-full"
          />
        )}
      </div>

      <span
        className={`text-sm font-medium ${
          isFailure
            ? 'text-red-700'
            : isActive
            ? 'text-blue-700'
            : 'text-gray-600'
        }`}
      >
        {step.label}
      </span>
    </motion.div>
  )
}
