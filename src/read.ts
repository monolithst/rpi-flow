import gpio from 'rpi-gpio'
import { READ } from './constants'

type CalculateGpm = {
  count: number,
  pulseFrequency: number,
}

type CancelToken = {
  keepGoing: () => boolean,
}

type CounterController = {
  getCount: () => number,
  resetCount: () => void,
  startCounter: () => void,
  stopCounter: () => void,
}

type ReadFlow = {
  cancelToken: CancelToken,
  pulseFrequency: number,
  controller: CounterController,
  cycleFrequencyInMs: number
}

type OnFlowReading = (gpm: number) => void

type ReadContinuousFlow = ReadFlow & {
  onFlowReading: OnFlowReading
}


const calculateGpm = ({count, pulseFrequency}:CalculateGpm) => {
  const litersPerMinute = count / pulseFrequency
  return litersToGallonsPerMinute(litersPerMinute)
}

const delay = (ms: number) => {
  return new Promise(r => setTimeout(r, ms))
}
  
const litersToGallonsPerMinute = (value: number) => value * 0.2642

const readContinuous = async ({cancelToken, pulseFrequency, controller, onFlowReading, cycleFrequencyInMs=1000}:ReadContinuousFlow) => {
  while(cancelToken.keepGoing()) {
    const gpm = await readOne({cancelToken, pulseFrequency, controller, cycleFrequencyInMs})
    await onFlowReading(gpm)
  }
}

const readOne = async ({cancelToken, pulseFrequency, controller, cycleFrequencyInMs=1000}: ReadFlow) => {
  controller.startCounter()
  await delay(cycleFrequencyInMs)
  controller.stopCounter()
  const gpm = calculateGpm({count: controller.getCount(), pulseFrequency})
  controller.resetCount()
  return gpm
}

const setup = ({
  gpioPin,
}: {gpioPin:number}) : CounterController => {
  let count = 0
  let shouldCount = false
  gpio.on('change', (channel, value) => {
    if (shouldCount) {
      count += 1
    }
  })
  gpio.setup(gpioPin, READ, gpio.EDGE_BOTH)
  return {
    getCount: () => count,
    resetCount: () => count = 0,
    startCounter: () => shouldCount = true,
    stopCounter: () => shouldCount = true,
  }
}


export {
  setup,
  readContinuous,
  readOne,
}

