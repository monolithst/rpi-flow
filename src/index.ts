import {
  setup,
  readContinuous,
  readOne,
  FlowGpioEdge,
  type CounterController,
  type ReadFlow,
  type ReadContinuousFlow,
  type SetupOptions,
} from './read'
import { DEVICES } from './constants'
import {
  litersFromCount,
  normalizeCalibration,
  type FlowCalibration,
  type FlowCalibrationNormalized,
} from './flowCalibration'

export {
  DEVICES,
  setup,
  readContinuous,
  readOne,
  FlowGpioEdge,
  normalizeCalibration,
  litersFromCount,
}

export type {
  FlowCalibration,
  FlowCalibrationNormalized,
  CounterController,
  ReadFlow,
  ReadContinuousFlow,
  SetupOptions,
}
