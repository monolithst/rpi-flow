const gpio = require('rpi-gpio')

export const READ = gpio.DIR_IN
export const WRITE = gpio.DIR_OUT

/** Preset calibrations; `PULSE_FREQUENCY` kept for backward compatibility with older call sites. */
export const DEVICES = {
  YF_S403: {
    /** @deprecated Use `CALIBRATION.slope` (Hz per L/min). */
    PULSE_FREQUENCY: 4.5,
    CALIBRATION: {
      slope: 4.5,
      intercept: 0,
      edgesPerPulse: 1 as const,
    },
  },
  /** Example sensor: F (Hz) = 8.1 × Q (L/min) − 5. */
  EXAMPLE_OFFSET_SENSOR: {
    CALIBRATION: {
      slope: 8.1,
      intercept: -5,
      edgesPerPulse: 1 as const,
    },
  },
}

export type MODE = 'mode_rpi' | 'mode_bcm'
export type PinDirection = 'in' | 'out' | 'low' | 'high'
export type EDGE = 'none' | 'rising' | 'falling' | 'both'
