export type FlowCalibration = Readonly<{
  /** Datasheet slope: Hz per (L/min), so F = slope * Q + intercept (Hz). */
  slope: number
  /** Frequency offset in Hz when flow is zero. Default 0. */
  intercept?: number
  /** Transitions counted per output pulse (1 = one edge per pulse, 2 = both edges). Default 1. */
  edgesPerPulse?: 1 | 2
}>

export type FlowCalibrationNormalized = Readonly<{
  slope: number
  intercept: number
  edgesPerPulse: 1 | 2
}>

export type NormalizeCalibrationArgs = Readonly<{
  calibration?: FlowCalibration
  /** @deprecated Prefer `calibration`; treated as { slope, intercept: 0, edgesPerPulse: 1 }. */
  pulseFrequency?: number
}>

export const normalizeCalibration = (
  args: NormalizeCalibrationArgs
): FlowCalibrationNormalized => {
  if (args.calibration) {
    const slope = args.calibration.slope
    if (typeof slope !== 'number' || Number.isNaN(slope)) {
      throw new Error('calibration.slope must be a finite number')
    }
    const edges = args.calibration.edgesPerPulse ?? 1
    if (edges !== 1 && edges !== 2) {
      throw new Error('calibration.edgesPerPulse must be 1 or 2')
    }
    if (slope === 0) {
      throw new Error('calibration.slope must be non-zero')
    }
    return {
      slope,
      intercept: args.calibration.intercept ?? 0,
      edgesPerPulse: edges,
    }
  }

  if (args.pulseFrequency !== undefined && args.pulseFrequency !== null) {
    const pf = args.pulseFrequency
    if (typeof pf !== 'number' || Number.isNaN(pf)) {
      throw new Error('pulseFrequency must be a finite number')
    }
    if (pf === 0) {
      throw new Error('pulseFrequency must be non-zero')
    }
    return {
      slope: pf,
      intercept: 0,
      edgesPerPulse: 1,
    }
  }

  throw new Error('Must provide calibration or pulseFrequency')
}

export type LitersFromCountArgs = Readonly<{
  count: number
  cycleFrequencyInMs: number
  calibration: FlowCalibrationNormalized
}>

/** Liters accumulated during the sample window; clamps at zero. */
export const litersFromCount = (args: LitersFromCountArgs): number => {
  const seconds = args.cycleFrequencyInMs / 1000
  if (seconds <= 0) {
    return 0
  }
  const hz = args.count / seconds / args.calibration.edgesPerPulse
  const litersPerMinute =
    (hz - args.calibration.intercept) / args.calibration.slope
  const liters = Math.max(0, litersPerMinute * (seconds / 60))
  return liters
}
