'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
  type TooltipValueType,
} from 'recharts';
import type { Sample } from '@/lib/engine';

const SYNC_ID = 'run-chart';
const AXIS_TICK = { fill: 'var(--color-muted)', fontSize: 11 };
const SERIES = [
  { key: 'wpm', label: 'WPM', color: 'var(--color-chart-wpm)', dashed: false },
  { key: 'raw', label: 'Raw', color: 'var(--color-chart-raw)', dashed: true },
] as const;

function ChartTooltip({ active, payload }: TooltipContentProps<TooltipValueType, string | number>) {
  const sample = payload?.[0]?.payload as Sample | undefined;
  if (!active || !sample) return null;
  return (
    <div className="rounded-md border border-line-strong bg-surface px-3 py-2 text-xs shadow-modal">
      <p className="mb-1 text-muted tabular-nums">{sample.second}s</p>
      {SERIES.map((series) => (
        <p key={series.key} className="flex items-center gap-2 text-ink tabular-nums">
          <span aria-hidden className="h-0.5 w-3 rounded-full" style={{ background: series.color }} />
          {series.label} <span className="ml-auto font-semibold">{sample[series.key]}</span>
        </p>
      ))}
      <p className="flex items-center gap-2 text-ink tabular-nums">
        <span aria-hidden className="size-2 rounded-xs bg-danger" />
        Errors <span className="ml-auto font-semibold">{sample.errors}</span>
      </p>
    </div>
  );
}

export default function WpmChart({ samples }: { samples: Sample[] }) {
  if (samples.length < 2) {
    return (
      <p className="flex h-48 items-center justify-center rounded-lg border border-dashed border-line-strong text-xs text-muted">
        Type for at least two seconds to see your speed over time.
      </p>
    );
  }

  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="flex flex-wrap items-center justify-between gap-2">
        <span className="label text-muted">Speed over time</span>
        {/* Legend: identity never relies on color alone (solid vs dashed) */}
        <span className="flex items-center gap-4 text-xs text-ink-dim">
          {SERIES.map((series) => (
            <span key={series.key} className="flex items-center gap-1.5">
              <svg width="16" height="4" aria-hidden>
                <line
                  x1="0"
                  y1="2"
                  x2="16"
                  y2="2"
                  stroke={series.color}
                  strokeWidth="2"
                  strokeDasharray={series.dashed ? '4 3' : undefined}
                />
              </svg>
              {series.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5">
            <span aria-hidden className="size-2 rounded-xs bg-danger" />
            Errors
          </span>
        </span>
      </figcaption>

      <div className="h-44 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={samples} syncId={SYNC_ID} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
            <CartesianGrid vertical={false} stroke="var(--color-line)" />
            <XAxis dataKey="second" hide />
            <YAxis tick={AXIS_TICK} tickLine={false} axisLine={false} allowDecimals={false} width={48} />
            <Tooltip
              content={ChartTooltip}
              cursor={{ stroke: 'var(--color-line-strong)', strokeWidth: 1 }}
              isAnimationActive={false}
            />
            {SERIES.map((series) => (
              <Line
                key={series.key}
                type="monotone"
                dataKey={series.key}
                name={series.label}
                stroke={series.color}
                strokeWidth={2}
                strokeDasharray={series.dashed ? '4 3' : undefined}
                dot={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--color-surface)' }}
                isAnimationActive={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Errors get their own strip: a different measure never shares the WPM axis */}
      <div className="h-12 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={samples} syncId={SYNC_ID} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
            <XAxis
              dataKey="second"
              tick={AXIS_TICK}
              tickLine={false}
              axisLine={{ stroke: 'var(--color-line)' }}
              tickFormatter={(s: number) => `${Math.round(s)}s`}
              minTickGap={24}
            />
            <YAxis hide allowDecimals={false} width={48} />
            <Tooltip content={() => null} cursor={{ fill: 'var(--color-raised)' }} />
            <Bar
              dataKey="errors"
              name="Errors"
              fill="var(--color-danger)"
              radius={[2, 2, 0, 0]}
              maxBarSize={8}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <details className="mt-1 text-xs">
        <summary className="w-fit cursor-pointer rounded-sm text-muted transition-ui hover:text-ink">
          View as table
        </summary>
        <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-line">
          <table className="w-full text-left tabular-nums">
            <caption className="sr-only">WPM, raw WPM and errors per second</caption>
            <thead className="sticky top-0 bg-surface text-muted">
              <tr>
                <th scope="col" className="px-3 py-1.5 font-semibold">
                  Second
                </th>
                <th scope="col" className="px-3 py-1.5 font-semibold">
                  WPM
                </th>
                <th scope="col" className="px-3 py-1.5 font-semibold">
                  Raw
                </th>
                <th scope="col" className="px-3 py-1.5 font-semibold">
                  Errors
                </th>
              </tr>
            </thead>
            <tbody>
              {samples.map((sample) => (
                <tr key={sample.second} className="border-t border-line text-ink-dim">
                  <td className="px-3 py-1">{sample.second}</td>
                  <td className="px-3 py-1">{sample.wpm}</td>
                  <td className="px-3 py-1">{sample.raw}</td>
                  <td className="px-3 py-1">{sample.errors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}
