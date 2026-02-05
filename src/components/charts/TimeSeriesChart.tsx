import { useMemo } from 'react';
import { Bar, BarChart, Brush, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Filters, QuakeFeature } from '../../data/types';
import { DAY_MS, formatUtcDate, utcDayStartMs } from '../../utils/time';

type DayCount = { dayMs: number; count: number };

function buildDailyCounts(quakes: QuakeFeature[], extentsTime: Filters['time']): DayCount[] {
  const startDay = utcDayStartMs(extentsTime.startMs);
  const endDay = utcDayStartMs(extentsTime.endMs);

  const counts = new Map<number, number>();
  for (const q of quakes) {
    const d = utcDayStartMs(q.properties.time);
    counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  const out: DayCount[] = [];
  for (let day = startDay; day <= endDay; day += DAY_MS) {
    out.push({ dayMs: day, count: counts.get(day) ?? 0 });
  }
  return out;
}

export default function TimeSeriesChart(props: {
  quakes: QuakeFeature[];
  extentsTime: Filters['time'];
  selectedTime: Filters['time'];
  onSetTimeRange: (startMs: number, endMs: number) => void;
}) {
  const data = useMemo(() => buildDailyCounts(props.quakes, props.extentsTime), [props.quakes, props.extentsTime]);

  const startDay = utcDayStartMs(props.extentsTime.startMs);
  const selStart = utcDayStartMs(props.selectedTime.startMs);
  const selEnd = utcDayStartMs(props.selectedTime.endMs);
  const startIndex = Math.max(0, Math.floor((selStart - startDay) / DAY_MS));
  const endIndex = Math.min(data.length - 1, Math.floor((selEnd - startDay) / DAY_MS));

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Daily quake count</div>
        <div className="panelMeta">Brush to set time range</div>
      </div>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 10, bottom: 12, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="dayMs"
              type="number"
              domain={['dataMin', 'dataMax']}
              tickFormatter={(ms) => formatUtcDate(ms as number)}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              interval="preserveStartEnd"
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              width={34}
            />
            <Tooltip
              labelFormatter={(ms) => formatUtcDate(ms as number)}
              contentStyle={{
                background: 'rgba(16, 25, 44, 0.95)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 10,
              }}
              itemStyle={{ color: 'rgba(255,255,255,0.9)' }}
              labelStyle={{ color: 'rgba(255,255,255,0.85)' }}
            />
            <Bar
              dataKey="count"
              fill="rgba(33, 158, 188, 0.95)"
              radius={[6, 6, 2, 2]}
              onClick={(d) => {
                const dayMs = (d as { dayMs?: number }).dayMs;
                if (typeof dayMs !== 'number') return;
                props.onSetTimeRange(dayMs, dayMs + DAY_MS - 1);
              }}
            />
            <Brush
              dataKey="dayMs"
              height={26}
              startIndex={startIndex}
              endIndex={endIndex}
              stroke="rgba(255,255,255,0.55)"
              travellerWidth={10}
              onChange={(r) => {
                if (!r) return;
                const si = r.startIndex ?? 0;
                const ei = r.endIndex ?? data.length - 1;
                const start = data[si]?.dayMs;
                const end = data[ei]?.dayMs;
                if (typeof start !== 'number' || typeof end !== 'number') return;
                props.onSetTimeRange(start, end + DAY_MS - 1);
              }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
