import { describe, it } from 'mocha'
import { assert } from 'chai'
import sinon from 'sinon'
import proxyquire from 'proxyquire'

const gpioStub = {
  on: sinon.stub(),
  setup: sinon.stub(),
}

const { readOne } = proxyquire('../../src/read', {
  'rpi-gpio': gpioStub,
  './constants': { READ: 'in' },
})

describe('/src/read.ts', () => {
  describe('#readOne()', () => {
    it('should return liters for pulseFrequency compatibility', async () => {
      const input = {
        controller: {
          getCount: () => 45,
          resetCount: () => undefined,
          startCounter: () => undefined,
          stopCounter: () => undefined,
        },
        pulseFrequency: 4.5,
        cycleFrequencyInMs: 1000,
      }
      const clock = sinon.useFakeTimers()
      const pending = readOne(input)
      await clock.tickAsync(1000)
      const actual = await pending
      clock.restore()
      const expected = 10 / 60
      assert.isAtMost(Math.abs(actual - expected), 1e-9)
    })

    it('should return zero when cancelToken says stop before sampling', async () => {
      const input = {
        controller: {
          getCount: () => 99,
          resetCount: () => undefined,
          startCounter: () => undefined,
          stopCounter: () => undefined,
        },
        calibration: { slope: 4.5 },
        cycleFrequencyInMs: 1000,
        cancelToken: { keepGoing: () => false },
      }
      const actual = await readOne(input)
      const expected = 0
      assert.equal(actual, expected)
    })
  })
})
