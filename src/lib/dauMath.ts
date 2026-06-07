/**
 * Piecewise power-law retention curve.
 *
 * Two segments anchored on the user-provided D1, D30, D180 retention points:
 *   - Day 1 → Day 30: power law fit through (1, D1) and (30, D30)
 *   - Day 30 → Day 180+: power law fit through (30, D30) and (180, D180)
 *
 * This is the same model the Growth Prophet app uses for DAU projection.
 *
 * @param t      Days since acquisition (>=0).
 * @param d1     Day-1 retention rate as percent (0–100).
 * @param d30    Day-30 retention rate as percent (0–100).
 * @param d180   Day-180 retention rate as percent (0–100).
 * @returns      Retention at day t, in the [0, 1] range.
 */
export function piecewiseRetention(
  t: number,
  d1: number,
  d30: number,
  d180: number,
): number {
  if (t === 0) return 1.0;
  if (d1 <= 0 || d30 <= 0 || d180 <= 0) return 0;

  const DAY_30 = 30;
  const DAY_180 = 180;

  const d1r = d1 / 100;
  const d30r = d30 / 100;
  const d180r = d180 / 100;

  let retention: number;

  if (t >= 1 && t <= DAY_30) {
    const b1 = -Math.log(d30r / d1r) / Math.log(DAY_30);
    retention = d1r * Math.pow(t, -b1);
  } else {
    const b2 = -Math.log(d180r / d30r) / Math.log(DAY_180 / DAY_30);
    retention = d30r * Math.pow(t / DAY_30, -b2);
  }

  return Math.max(0, Math.min(1, isFinite(retention) ? retention : 0));
}

export interface ForecastPoint {
  day: number;
  date: string;
  existing: number;
  new: number;
  total: number;
}

export interface ForecastInput {
  d1: number;
  d30: number;
  d180: number;
  dailyNewUsers: number;
  days: number;
  existingDAU?: number;
  monthlyChurnPct?: number; // monthly churn % for the existing DAU base (0-100)
  startDate?: Date;
}

/**
 * Generate a DAU projection by cohort-summing the retention curve over a horizon.
 *
 * Existing DAU decays by `monthlyChurnPct` per 30 days. New cohorts arrive every day
 * at `dailyNewUsers` and retain per the piecewise curve.
 */
export function generateForecastData(input: ForecastInput): ForecastPoint[] {
  const {
    d1,
    d30,
    d180,
    dailyNewUsers,
    days,
    existingDAU = 0,
    monthlyChurnPct = 0,
    startDate = new Date(),
  } = input;

  const monthlyRetention = Math.max(0, Math.min(1, 1 - monthlyChurnPct / 100));
  const dailyDecay = monthlyRetention === 0 ? 0 : Math.pow(monthlyRetention, 1 / 30);

  const results: ForecastPoint[] = [];

  for (let day = 0; day < days; day++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + day);
    const dateStr = currentDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    const existing = Math.round(existingDAU * Math.pow(dailyDecay, day));

    let cumulativeNewDAU = 0;
    for (let cohortDay = 0; cohortDay < day; cohortDay++) {
      const age = day - cohortDay;
      const ret = piecewiseRetention(age, d1, d30, d180);
      cumulativeNewDAU += dailyNewUsers * ret;
    }
    const newUsers = Math.round(cumulativeNewDAU);
    const total = existing + newUsers;

    results.push({ day, date: dateStr, existing, new: newUsers, total });
  }

  return results;
}

/**
 * Sum of daily retention rates over the first N days — interpretable as
 * the expected number of active days a single acquired user will have within N days.
 */
export function lifetimeDays(
  d1: number,
  d30: number,
  d180: number,
  horizonDays: number,
): number {
  let sum = 0;
  for (let t = 1; t <= horizonDays; t++) {
    sum += piecewiseRetention(t, d1, d30, d180);
  }
  return sum;
}

export interface ValidationError {
  ok: false;
  error: string;
}
export interface ValidationOk {
  ok: true;
}
export type Validation = ValidationOk | ValidationError;

/**
 * Enforce the Growth Prophet invariant: 0 < D180 ≤ D30 ≤ D1 ≤ 100.
 */
export function validateRetentionInputs(
  d1: number,
  d30: number,
  d180: number,
): Validation {
  if (!Number.isFinite(d1) || !Number.isFinite(d30) || !Number.isFinite(d180)) {
    return { ok: false, error: "d1, d30, d180 must be finite numbers" };
  }
  if (d1 <= 0 || d30 <= 0 || d180 <= 0) {
    return { ok: false, error: "d1, d30, d180 must each be > 0" };
  }
  if (d1 > 100 || d30 > 100 || d180 > 100) {
    return { ok: false, error: "d1, d30, d180 are percentages and must each be ≤ 100" };
  }
  if (!(d180 <= d30 && d30 <= d1)) {
    return {
      ok: false,
      error: `Retention must be monotonic non-increasing: require d180 ≤ d30 ≤ d1. Got d1=${d1}, d30=${d30}, d180=${d180}.`,
    };
  }
  return { ok: true };
}
