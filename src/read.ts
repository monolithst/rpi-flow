import gpio from 'rpi-gpio'
import { READ } from './constants'
import type { EDGE } from './constants'
import {
  litersFromCount,
  normalizeCalibration,
  type FlowCalibration,
  type FlowCalibrationNormalized,
} from './flowCalibration'

export enum FlowGpioEdge {
  Rising = 'rising',
  Falling = 'falling',
  Both = 'both',
}

type CancelToken = Readonly<{
  keepGoing: () => boolean
}>

export type CounterController = Readonly<{
  getCount: () => number
  resetCount: () => void
  startCounter: () => void
  stopCounter: () => void
}>

export type ReadFlow = Readonly<{
  controller: CounterController
  cycleFrequencyInMs?: number
  calibration?: FlowCalibration
  /** @deprecated Use `calibration` with `slope` (Hz per L/min). */
  pulseFrequency?: number
  cancelToken?: CancelToken
}>

type OnFlowReading = (litersInSample: number) => void | Promise<void>

export type ReadContinuousFlow = Readonly<
  ReadFlow & {
    cancelToken: CancelToken
    onFlowReading: OnFlowReading
  }
>

export type SetupOptions = Readonly<{
  gpioPin: number
  /** GPIO edge to count; default rising (one transition per pulse). */
  edge?: FlowGpioEdge
}>

const delay = (ms: number) => {
  return new Promise(r => setTimeout(r, ms))
}

const gpioEdgeFor = (edge: FlowGpioEdge | undefined): EDGE => {
  if (edge === FlowGpioEdge.Falling) {
    return gpio.EDGE_FALLING
  }
  if (edge === FlowGpioEdge.Both) {
    return gpio.EDGE_BOTH
  }
  return gpio.EDGE_RISING
}

const readSampleLiters = (
  controller: CounterController,
  cycleFrequencyInMs: number,
  normalized: FlowCalibrationNormalized
) => {
  controller.resetCount()
  controller.startCounter()
  return delay(cycleFrequencyInMs).then(() => {
    controller.stopCounter()
    const count = controller.getCount()
    const liters = litersFromCount({
      count,
      cycleFrequencyInMs,
      calibration: normalized,
    })
    controller.resetCount()
    return liters
  })
}

export const readContinuous = async (
  args: ReadContinuousFlow
): Promise<void> => {
  const cycleFrequencyInMs = args.cycleFrequencyInMs ?? 1000
  const normalized = normalizeCalibration({
    calibration: args.calibration,
    pulseFrequency: args.pulseFrequency,
  })
  while (args.cancelToken.keepGoing()) {
    const liters = await readSampleLiters(
      args.controller,
      cycleFrequencyInMs,
      normalized
    )
    await args.onFlowReading(liters)
  }
}

export const readOne = async (args: ReadFlow): Promise<number> => {
  const cycleFrequencyInMs = args.cycleFrequencyInMs ?? 1000
  const normalized = normalizeCalibration({
    calibration: args.calibration,
    pulseFrequency: args.pulseFrequency,
  })
  if (args.cancelToken && args.cancelToken.keepGoing() === false) {
    return 0
  }
  return readSampleLiters(args.controller, cycleFrequencyInMs, normalized)
}

export const setup = (options: SetupOptions): CounterController => {
  let count = 0
  let shouldCount = false
  gpio.on('change', (_channel, _value) => {
    if (shouldCount) {
      count += 1
    }
  })
  gpio.setup(options.gpioPin, READ, gpioEdgeFor(options.edge))
  return {
    getCount: () => count,
    resetCount: () => {
      count = 0
    },
    startCounter: () => {
      shouldCount = true
    },
    stopCounter: () => {
      shouldCount = false
    },
  }
}
