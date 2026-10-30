import { consistencyOf, type Sample } from '@/lib/engine';

/**
 * SAMPLE DATA: one made-up 30-second run for the results showcase. The headline numbers are
 * derived from these samples with the app's own formulas, so the chart and the stats agree.
 */
const RAW_PER_SECOND = [
  96, 108, 114, 102, 121, 126, 118, 92, 110, 124, 131, 122, 116, 128, 134, 120, 98, 115, 127, 132, 125, 119,
  129, 136, 124, 117, 130, 138, 127, 133,
];
const ERRORS_PER_SECOND = [
  0, 1, 0, 0, 0, 1, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 2, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0,
];

function buildSamples(): Sample[] {
  let correct = 0;
  return RAW_PER_SECOND.map((raw, i) => {
    const second = i + 1;
    // Raw WPM within a second is characters × 12; mistyped characters are not net progress
    correct += raw / 12 - ERRORS_PER_SECOND[i];
    return { second, wpm: Math.round((correct / 5) * (60 / second)), raw, errors: ERRORS_PER_SECOND[i] };
  });
}

export const SHOWCASE_SAMPLES = buildSamples();

const typed = RAW_PER_SECOND.reduce((sum, raw) => sum + raw / 12, 0);
const errors = ERRORS_PER_SECOND.reduce((sum, n) => sum + n, 0);

export const SHOWCASE_STATS = {
  language: 'TypeScript',
  mode: 'Time 30s',
  wpm: SHOWCASE_SAMPLES.at(-1)!.wpm,
  raw: Math.round(RAW_PER_SECOND.reduce((sum, raw) => sum + raw, 0) / RAW_PER_SECOND.length),
  accuracy: Math.round(((typed - errors) / typed) * 1000) / 10,
  consistency: consistencyOf(SHOWCASE_SAMPLES) ?? 0,
  errors,
};
