const { ArgumentParser } = require('argparse')
const {
  setup,
  readContinuous,
} = require('../dist/read')
const { DEVICES } = require('../dist/constants')

const _parseArguments = () => {
  const parser = new ArgumentParser({
    description: 'Streams the amount of fluid that has passed through a flow meter and prints it to the console.',
  })
  parser.add_argument('gpioPin', {
    help: 'The pin number to use. Example: GPIO4 = 7.',
  })
  parser.add_argument('-p', '--pulseFrequency', {
    help: 'Overrides the default device pulse frequency.',
  })
  parser.add_argument('-d', '--deviceName', {
    help: 'The device type to read. Defaults to YF_S403',
    default: 'YF_S403',
  })
  return parser.parse_args()
}

const readRateInGpm = (value) => {
  return value * 60 * 0.2642
}

const main = async () => {
  const args = _parseArguments()
  const gpioPin = args.gpioPin
  const deviceName = args.deviceName
  const pulseFrequency = args.pulseFrequency
    ? args.pulseFrequency
    : DEVICES[deviceName].PULSE_FREQUENCY

  const cancelToken = {
    keepGoing: () => true
  }

  const onFlowReading = (value) => {
    if (value > 0) {
      const gpm = readRateInGpm(value)
      console.info(`${Number(value).toFixed(3)} liters @ ${Number(gpm).toFixed(2)} gpm`)
    }
  }

  const controller = setup({ gpioPin })
  await readContinuous({ cancelToken, pulseFrequency, controller, onFlowReading })
  return 0
}

if (require.main === module) {
  return main()
}

return -1
