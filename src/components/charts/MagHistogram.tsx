import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { Filters, QuakeFeature } from '../../data/types';
import { histogramEvenBins } from '../../utils/bins';

export default function MagHistogram(props: {
  quakes: QuakeFeature[];
  extentsMag: Filters['mag'];
  selectedMag: Filters['mag'];
  onSetMagRange: (min: number, max: number) => void;
}) {
  const data = useMemo(() => {
    const mags = props.quakes.map((q) => q.properties.mag);
    return histogramEvenBins(mags, props.extentsMag.min, props.extentsMag.max, 0.5, { labelDigits: 1 });
  }, [props.quakes, props.extentsMag]);

  return (
    <section className="panel">
      <div className="panelHeader">
        <div className="panelTitle">Magnitude histogram</div>
        <div className="panelMeta">Click a bin to set mag range</div>
      </div>
      <div className="chartWrap">
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 10, bottom: 24, left: 0 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 10 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              interval={1}
              angle={-25}
              textAnchor="end"
              height={48}
            />
            <YAxis
              allowDecimals={false}
              tick={{ fill: 'rgba(255,255,255,0.7)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              tickLine={{ stroke: 'rgba(255,255,255,0.12)' }}
              width={34}
            />
            <Tooltip
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
              radius={[6, 6, 2, 2]}
              onClick={(d) => {
                const anyD = d as { start?: number; end?: number };
                if (typeof anyD.start !== 'number' || typeof anyD.end !== 'number') return;
                props.onSetMagRange(anyD.start, anyD.end);
              }}
            >
              {data.map((b) => {
                const inSel = b.start >= props.selectedMag.min && b.end <= props.selectedMag.max;
                return (
                  <Cell
                    key={b.label}
                    fill={inSel ? 'rgba(255, 183, 3, 0.95)' : 'rgba(255,255,255,0.18)'}
                  />
                );
              })}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

