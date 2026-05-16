import { describe, it } from 'mocha'
import { assert } from 'chai'
import {
  litersFromCount,
  normalizeCalibration,
} from '../../src/flowCalibration'

describe('/src/flowCalibration.ts', () => {
  describe('#normalizeCalibration()', () => {
    it('should map pulseFrequency to slope with zero intercept and single edge', () => {
      const input = { pulseFrequency: 4.5 }
      const actual = normalizeCalibration(input)
      const expected = { slope: 4.5, intercept: 0, edgesPerPulse: 1 as const }
      assert.deepEqual(actual, expected)
    })

    it('should prefer calibration when both are provided', () => {
      const input = {
        calibration: { slope: 4.5, intercept: -5, edgesPerPulse: 2 as const },
        pulseFrequency: 9.31,
      }
      const actual = normalizeCalibration(input)
      const expected = { slope: 4.5, intercept: -5, edgesPerPulse: 2 as const }
      assert.deepEqual(actual, expected)
    })

    it('should default intercept and edgesPerPulse on calibration', () => {
      const input = { calibration: { slope: 8.1 } }
      const actual = normalizeCalibration(input)
      const expected = { slope: 8.1, intercept: 0, edgesPerPulse: 1 as const }
      assert.deepEqual(actual, expected)
    })

    it('should throw when neither calibration nor pulseFrequency is provided', () => {
      const input = {}
      assert.throws(() => normalizeCalibration(input), /Must provide/)
    })

    it('should throw when slope is zero', () => {
      const input = { calibration: { slope: 0 } }
      assert.throws(() => normalizeCalibration(input), /non-zero/)
    })
  })

  describe('#litersFromCount()', () => {
    it('should scale liters for a 1 second window with intercept zero', () => {
      const input = {
        count: 45,
        cycleFrequencyInMs: 1000,
        calibration: { slope: 4.5, intercept: 0, edgesPerPulse: 1 as const },
      }
      const actual = litersFromCount(input)
      const expected = 10 / 60
      assert.isAtMost(Math.abs(actual - expected), 1e-9)
    })

    it('should scale liters for a non-1-second window', () => {
      const input = {
        count: 90,
        cycleFrequencyInMs: 2000,
        calibration: { slope: 4.5, intercept: 0, edgesPerPulse: 1 as const },
      }
      const actual = litersFromCount(input)
      const expected = 20 / 60
      assert.isAtMost(Math.abs(actual - expected), 1e-9)
    })

    it('should apply intercept in Hz before dividing by slope', () => {
      const input = {
        count: 100,
        cycleFrequencyInMs: 1000,
        calibration: { slope: 8.1, intercept: -5, edgesPerPulse: 1 as const },
      }
      const litersPerMinute = (100 + 5) / 8.1
      const expected = (litersPerMinute * 1) / 60
      const actual = litersFromCount(input)
      assert.isAtMost(Math.abs(actual - expected), 1e-9)
    })

    it('should divide counts by edgesPerPulse when set to 2', () => {
      const input = {
        count: 90,
        cycleFrequencyInMs: 1000,
        calibration: { slope: 4.5, intercept: 0, edgesPerPulse: 2 as const },
      }
      const actual = litersFromCount(input)
      const expected = 10 / 60
      assert.isAtMost(Math.abs(actual - expected), 1e-9)
    })

    it('should clamp negative flow to zero', () => {
      const input = {
        count: 0,
        cycleFrequencyInMs: 1000,
        calibration: { slope: 8.1, intercept: 5, edgesPerPulse: 1 as const },
      }
      const actual = litersFromCount(input)
      const expected = 0
      assert.equal(actual, expected)
    })
  })
})
