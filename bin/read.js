const { ArgumentParser } = require('argparse')
const { setup, readContinuous, FlowGpioEdge } = require('../dist/read')
const { DEVICES } = require('../dist/constants')

const _parseArguments = () => {
  const parser = new ArgumentParser({
    description:
      'Streams the amount of fluid that has passed through a flow meter and prints it to the console.',
  })
  parser.add_argument('gpioPin', {
    help: 'The pin number to use. Example: GPIO4 = 7.',
  })
  parser.add_argument('-p', '--pulseFrequency', {
    help: 'Deprecated: Hz per (L/min) with zero intercept and single-edge counting. Prefer --slope.',
  })
  parser.add_argument('--slope', {
    help: 'Calibration slope in Hz per (L/min). Overrides device preset when set.',
  })
  parser.add_argument('--intercept', {
    help: 'Calibration intercept in Hz (default from device or 0).',
  })
  parser.add_argument('--edges-per-pulse', {
    help: 'Counted transitions per pulse: 1 or 2 (default from device or 1).',
  })
  parser.add_argument('--edge', {
    choices: ['rising', 'falling', 'both'],
    default: 'rising',
    help: 'GPIO edge mode for counting (default rising).',
  })
  parser.add_argument('-d', '--deviceName', {
    help: 'The device type to read. Defaults to YF_S403',
    default: 'YF_S403',
  })
  return parser.parse_args()
}

const readRateInGpm = value => {
  return value * 60 * 0.2642
}

const _edgeFromArg = edge => {
  if (edge === 'falling') {
    return FlowGpioEdge.Falling
  }
  if (edge === 'both') {
    return FlowGpioEdge.Both
  }
  return FlowGpioEdge.Rising
}

const _calibrationFromArgs = args => {
  const device = DEVICES[args.deviceName]
  if (!device) {
    throw new Error(`Unknown deviceName: ${args.deviceName}`)
  }
  const preset = device.CALIBRATION
  const slopeFromPulse =
    args.pulseFrequency !== undefined && args.pulseFrequency !== null
      ? Number(args.pulseFrequency)
      : undefined
  const slopeFromFlag =
    args.slope !== undefined && args.slope !== null
      ? Number(args.slope)
      : undefined
  const slope =
    slopeFromFlag !== undefined && !Number.isNaN(slopeFromFlag)
      ? slopeFromFlag
      : slopeFromPulse !== undefined && !Number.isNaN(slopeFromPulse)
        ? slopeFromPulse
        : preset
          ? preset.slope
          : device.PULSE_FREQUENCY
  const interceptRaw =
    args.intercept !== undefined && args.intercept !== null
      ? Number(args.intercept)
      : preset
        ? (preset.intercept ?? 0)
        : 0
  const edgesRaw =
    args.edges_per_pulse !== undefined && args.edges_per_pulse !== null
      ? Number(args.edges_per_pulse)
      : preset
        ? (preset.edgesPerPulse ?? 1)
        : 1
  const edgesPerPulse = edgesRaw === 2 ? 2 : 1
  return {
    slope,
    intercept: Number.isNaN(interceptRaw) ? 0 : interceptRaw,
    edgesPerPulse,
  }
}

const main = async () => {
  const args = _parseArguments()
  const gpioPin = Number(args.gpioPin)
  const calibration = _calibrationFromArgs(args)
  const cancelToken = {
    keepGoing: () => true,
  }

  const onFlowReading = value => {
    if (value > 0) {
      const gpm = readRateInGpm(value)
      console.info(
        `${Number(value).toFixed(3)} liters @ ${Number(gpm).toFixed(2)} gpm`
      )
    }
  }

  const controller = setup({ gpioPin, edge: _edgeFromArg(args.edge) })
  await readContinuous({
    cancelToken,
    controller,
    onFlowReading,
    calibration,
  })
  return 0
}

if (require.main === module) {
  return main()
}

return -1
